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
  updateState,
  getProducts,
} from "../db/models/product";
import { extractSKUFromUrl } from "../utils/helpers";
import { readLinksFromCsv } from "../utils/csvHelper";
import { insertPostedLink, postedLinkExist } from "../db/models/postedLink";
import { getError, getErrors, insertError } from "../db/models/error";
import { isAxiosError } from "axios";
import { Task } from "../models/taskManager";
import { ScrapingBeeError } from "../errors/scrapingBeeError";
import { getStoreByAlias } from "../db/models/store";
import { getOneProducStore, getProducStore } from "../db/models/productStore";
import { deleteScrape, getToScrape, ToScrape } from "../db/models/toscrape";

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

  const linkList = await readLinksFromCsv();

  let totalProducts = 0;
  let limit = 1500;

  const browser = await chromium.launch({ headless: true });
  const cookies: cookie[] = await readJSON("data/cookies.json");
  // const productStore = (await getProducts({ }, {})).map(
  //   (el) => el.sku || ""
  // );
  const skuList: ToScrape[] = await getToScrape({});
  // await deleteScrape({ sku: { $in: productStore } }, {});
  // const taskList = await Task.getTasks(linkList);
  // await input("continue");
  const taskList: any[] = ["a"];

  const weightEnum: Record<string, number> = {
    MCO414014: 4,
    MCO442223: 6,
    MCO177998: 4,
    MCO412007: 4,
    MCO116348: 4,
    MCO180784: 2,
    MCO441996: 1,
    MCO416860: 1,
    MCO176837: 1,
    MCO87920: 1,
    MCO3697: 1,
    MCO177999: 4,
    MCO176296: 4,
    MCO424978: 1,
    MCO3018: 15,
    MCO29465: 15,
    MCO4275: 15,
    MCO441494: 10,
    MCO87926: 10,
    MCO412401: 4,
    MCO173824: 6,
    MCO116352: 8,
    MCO178000: 8,
    MCO372121: 6,
    MCO416668: 2,
    MCO416667: 4,
    MCO4633: 10,
    MCO166465: 2,
    MCO166576: 6,
    MCO442023: 6,
    MCO3772: 6,
    MCO442129: 10,
    MCO417360: 8,
    MCO8937: 10,
    MCO3770: 10,
    MCO442189: 40,
    MCO1014: 40,
    MCO166528: 10,
    MCO8436: 8,
    MCO3011: 30,
    MCO180028: 15,
    MCO8456: 30,
  };

  for (const task of taskList) {
    // if (await postedLinkExist(task.mainUrl)) {
    //   continue;
    // }

    // await task.saveTask();

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
    // const itemsPage = new ItemsPage(context);

    // try {
    //   await itemsPage.mapAllLinks2(task);
    // } catch (error) {
    //   if (isAxiosError(error)) {
    //     console.log(error.response?.data);
    //   } else {
    //     console.log(error);
    //   }
    // }
    // await itemsPage.descompose();

    // console.log("Links encontrados:", task.linkList.length);

    // totalProducts += task.linkList.length;

    let postedProducts = 0;
    let errorsCount = 0;
    let maxWorkers = 5;

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
    // const skuList: string[] = await readJSON("data/toScrape.json");

    const scrapeItem = async (link: string): Promise<Product | null> => {
      const errorExist = await getError({ link });
      if (errorExist) return null;
      const sku = extractSKUFromUrl(link);
      const category_id = skuList.find((el) => el.sku == sku)?.category_id;
      if (postedProducts < 5) {
        console.log(category_id, weightEnum[category_id || ""]);
      }
      if (
        sku == "B08CS1X53V" ||
        sku == "B0D6GXKKF6" ||
        sku == "B077PK2GBT" ||
        sku == "B08FX6Q4H3"
      ) {
        return null;
      }
      if (sku) {
        const productStore = await getOneProducStore({ productSku: sku });
        if (productStore?.state != "active") {
          console.log("producto inactivo");
          return null;
        }
        const item = await getProductBySku(sku);
        if (item) {
          throw new Error("Producto duplicado");
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
          const pageData = await runWithTimeout(itemPage.getPageData(), 16000);
          await itemPage.descompose();
          contextPool.push(newContext);
          if (!pageData.checkWeight()) {
            console.log("Setting default weight");
            pageData.setDefaultWeight(`${weightEnum[category_id || ""]} lb`);
          }
          await pageData.setCategoryId(category_id || "");
          pageData.correctTittle();
          pageData.correctDescription();
          let data: ProductItem;
          try {
            data = {
              ...pageData.getItemInfo(),
              item_id: null,
              state: "pending",
            };
            postedProducts++;
          } catch (error) {
            data = {
              ...pageData.getItemInfo(),
              item_id: null,
              state: "error",
            };
            errorsCount++;
          }

          await createProduct(data);
          console.log(
            `${sku} ${postedProducts} publicados de ${skuList.length} - ${errorsCount} productos omitidos`
          );
          await saveData(sku, "data/scraped.json");
          // await task.addSku(data.sku || "");
          // await task.deleteLinkElement(link);
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
          // await task.deleteLinkElement(link);
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
        skuList.map((sku) => `https://www.amazon.com/-/es/dp/${sku.sku}`),
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

    // await insertPostedLink({
    //   link: task.mainUrl,
    //   category_id: task.category_id,
    //   updated: false,
    //   skuList: task.skuList,
    //   lastUpdate: new Date(),
    // });
    // await task.endTask();
    // console.log(`${postedProducts} publicados de ${task.linkList.length}`);
  }
  await browser.close();

  process.exit(0);
})();
