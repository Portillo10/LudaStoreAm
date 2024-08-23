import { config } from "dotenv";
config();
import { BrowserContext, chromium } from "playwright";
import { ItemsPage } from "../pages/ItemsPage";
import { ItemPage } from "../pages/ItemPage";
import { runTasks, runTasksVoid, runWithTimeout } from "../utils/taskExecutor";
import { Product } from "../models/Product";
import {
  getRandomUserAgent,
  readJSON,
  saveData,
  writeJSON,
} from "../utils/jsonHelper";
import { getUsdToCopRate } from "../services/forex";
import { refreshAccessToken } from "../services/auth";
import { postProduct } from "../services/pubs";
import { connectToDatabase } from "../db/database";
import { createItem, Item } from "../db/models/Item";
import { input } from "../utils/inputHelper";
import { deleteLink, insertLinks } from "../db/models/link";
import {
  createProduct,
  ProductItem,
  getProductBySku,
  activateProduct,
} from "../db/models/product";
import { extractSKUFromUrl } from "../utils/helpers";
import { readLinksFromCsv } from "../utils/csvHelper";
import { insertPostedLink, postedLinkExist } from "../db/models/postedLink";
import { insertError } from "../db/models/error";
import { isAxiosError } from "axios";
import { Task } from "../models/taskManager";
import { createTask } from "../db/models/task";

interface cookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite: "Strict" | "Lax" | "None";
}

(async () => {
  await connectToDatabase();
  let token = await refreshAccessToken();
  if (!token) throw new Error("No fue posible obtener el token");

  const usdRate = await getUsdToCopRate();
  if (!usdRate) throw new Error("No fue posible obtener el precio del dolar");

  const linkList = await readLinksFromCsv();

  const defaultWeight = 1;

  let totalProducts = 0;
  let limit = 1500;

  const browser = await chromium.launch({ headless: true });
  const cookies: cookie[] = await readJSON("data/cookies.json");

  const taskList = await Task.getTasks(linkList);

  for (const task of taskList) {
    if (totalProducts >= limit) {
      token = await refreshAccessToken();
      limit += 1500;
    }

    if (await postedLinkExist(task.mainUrl)) {
      continue;
    }

    await task.saveTask()

    const storageState = {
      cookies,
      origins: [
        {
          origin: "https://www.amazon.com/",
          localStorage: [],
        },
      ],
    };

    const randomUserAgent = await getRandomUserAgent();
    const context = await browser.newContext({
      userAgent: randomUserAgent,
      ignoreHTTPSErrors: true,
    });
    const itemsPage = new ItemsPage(context);


    try {
      await itemsPage.mapAllLinks2(task);
    } catch (error) {
      if (isAxiosError(error)) {
        console.log(error.response?.data);
      } else {
        console.log(error);
      }
    }

    await itemsPage.descompose();

    console.log("Links encontrados:", task.linkList.length);

    totalProducts += task.linkList.length;

    // await insertLinks(task.linkList, task.category_id || "");

    let postedProducts = 0;
    let errorsCount = 0;
    let maxWorkers = 4;

    const contextPool: BrowserContext[] = [];

    for (let i = 0; i < maxWorkers; i++) {
      const userAgent = await getRandomUserAgent();
      contextPool.push(
        await browser.newContext({
          userAgent,
          ignoreHTTPSErrors: true,
        })
      );
    }

    // await insertPostedLink({
    //   link: task.mainUrl,
    //   category_id: task.category_id,
    // });

    const scrapeItem = async (link: string): Promise<Product> => {
      const sku = extractSKUFromUrl(link);
      await task.deleteLinkElement(link)
      if (sku) {
        const item = await getProductBySku(sku);
        if (item) {
          if (item.state == "error") {
            const { _id, ...itemData } = item;
            try {
              const productData = new Product({
                title: "",
                price: 0,
                description: "",
                sku: "",
              });
              productData.setData(itemData);
              const { product_id, ml_price } = await postProduct(
                productData,
                token,
                usdRate
              );

              await activateProduct(sku, product_id);
              await deleteLink(link);
              postedProducts++;
              return productData;
            } catch (error) {
              errorsCount++;
            }
          } else if (item.state == "active") {
            console.log("producto duplicado");
            return new Product({});
          }
          // return new Product()
        }
      }

      let attemp = 1;
      let newContext: BrowserContext | undefined = undefined;
      let itemPage: ItemPage | undefined = undefined;
      while (attemp <= 3) {
        try {
          newContext =
            contextPool.pop() ||
            (await browser.newContext({
              ignoreHTTPSErrors: true,
            }));
          if (!newContext)
            throw new Error("Error obteniendo contexto de contextPool");
          itemPage = new ItemPage(newContext);
          await itemPage.navigateTo(link);
          const pageData = await runWithTimeout(itemPage.getPageData(), 12000);
          await itemPage.descompose();
          contextPool.push(newContext);
          if (!pageData.checkWeight()) {
            console.log("Setting default weight");
            pageData.setWeight(`${defaultWeight} lb`);
          }
          await pageData.setCategoryId(task.category_id || "");
          pageData.correctTittle();
          pageData.correctDescription();
          try {
            const { product_id, ml_price } = await postProduct(
              pageData,
              token,
              usdRate
            );
            const data: ProductItem = {
              ...pageData.getItemInfo(),
              item_id: product_id,
              state: "active",
            };

            await createProduct(data);
            await deleteLink(link);
            postedProducts++;
            console.log(
              `${postedProducts} publicados de ${task.linkList.length} - ${errorsCount} productos omitidos`
            );
          } catch (error) {
            const data: ProductItem = {
              ...pageData.getItemInfo(),
              item_id: null,
              state: "error",
            };

            await createProduct(data);
          }
          await deleteLink(link);
          return pageData;
        } catch (error) {
          if (newContext) contextPool.unshift(newContext);
          if (itemPage) {
            itemPage.descompose();
          }
          if (
            error instanceof Error &&
            error.message === "Operation timed out" &&
            attemp < 3
          ) {
            attemp++;
            continue;
          }
          try {
            await insertError({
              errorMsg: error instanceof Error ? error.message : "",
              link,
              category_id: task.category_id || "",
              errorTime: new Date(),
            });
          } catch (error) {}
          errorsCount++;
          throw error;
        }
      }
      if (newContext) {
        contextPool.push(newContext);
      }

      throw new Error("Max retries reached");
    };

    try {
      await runTasksVoid<string, Product>(task.linkList, scrapeItem, maxWorkers);
    } catch (error) {
      console.error("Error durante la ejecución de tareas:", error);
    } finally {
      for (const context of contextPool) {
        await context.close();
      }
    }
    await task.endTask()
    console.log(`${postedProducts} publicados de ${task.linkList.length}`);
  }
  await browser.close();

  process.exit(0);
})();
