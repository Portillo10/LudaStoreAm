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
import { ScrapingBeeError } from "../errors/scrapingBeeError";

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
  // let token = await refreshAccessToken("LudaStore");

  // if (!token) throw new Error("No fue posible obtener el token");

  // const usdRate = await getUsdToCopRate();
  // if (!usdRate) throw new Error("No fue posible obtener el precio del dolar");

  const linkList = await readLinksFromCsv();

  let totalProducts = 0;
  let limit = 1500;

  const browser = await chromium.launch({ headless: true });
  const cookies: cookie[] = await readJSON("data/cookies.json");

  const taskList = await Task.getTasks(linkList);

  for (const task of taskList) {
    // if (totalProducts >= limit) {
    //   token = await refreshAccessToken("LudaStore");
    //   limit += 1500;
    // }

    if (await postedLinkExist(task.mainUrl)) {
      continue;
    }

    await task.saveTask();

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

    let postedProducts = 0;
    let errorsCount = 0;
    let maxWorkers = 3;

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

    const scrapeItem = async (link: string): Promise<Product | null> => {
      const sku = extractSKUFromUrl(link);
      if (sku) {
        const item = await getProductBySku(sku);
        if (item) {
          return null;
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
            pageData.setDefaultWeight(`${task.weight} lb`);
          }
          await pageData.setCategoryId(task.category_id || "");
          pageData.correctTittle();
          pageData.correctDescription();
          // console.log(pageData.getItemInfo());
          // await input("Presione enter")
          let data: ProductItem;
          try {
            // const { product_id, ml_price } = await postProduct(
            //   pageData,
            //   token,
            //   usdRate
            // );
            data = {
              ...pageData.getItemInfo(),
              item_id: null,
              state: "pending",
            };

            postedProducts++;
            console.log(
              `${postedProducts} publicados de ${task.linkList.length} - ${errorsCount} productos omitidos`
            );
          } catch (error) {
            data = {
              ...pageData.getItemInfo(),
              item_id: null,
              state: "error",
            };
            errorsCount++;
          }

          await createProduct(data);
          await task.deleteLinkElement(link);
          return pageData;
        } catch (error) {
          if (newContext) contextPool.unshift(newContext);
          if (itemPage) {
            itemPage.descompose();
          }

          if (error instanceof ScrapingBeeError) {
            process.exit(0);
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
          await task.deleteLinkElement(link);
          throw error;
        }
      }
      if (newContext) {
        contextPool.push(newContext);
      }
      throw new Error("Max retries reached");
    };

    try {
      await runTasksVoid<string, Product>(
        task.linkList,
        scrapeItem,
        maxWorkers
      );
    } catch (error) {
      console.error("Error durante la ejecución de tareas:", error);
    } finally {
      for (const context of contextPool) {
        await context.close();
      }
    }

    await insertPostedLink({
      link: task.mainUrl,
      category_id: task.category_id,
      updated: false,
    });
    await task.endTask();
    console.log(`${postedProducts} publicados de ${task.linkList.length}`);
  }
  await browser.close();

  process.exit(0);
})();
