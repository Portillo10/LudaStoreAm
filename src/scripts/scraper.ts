import { config } from "dotenv";
config();
import { BrowserContext, chromium } from "playwright";
import { ItemsPage } from "../pages/ItemsPage";
import { ItemPage } from "../pages/ItemPage";
import { runTasks, runTasksVoid, runWithTimeout } from "../utils/taskExecutor";
import { Product } from "../models/Product";
import { getRandomUserAgent, readJSON, saveData, writeJSON } from "../utils/jsonHelper";
import { getUsdToCopRate } from "../services/forex";
import { refreshAccessToken } from "../services/auth";
import { postProduct } from "../services/pubs";
import { connectToDatabase } from "../db/database";
import { createItem, Item } from "../db/models/Item";
import { input } from "../utils/inputHelper";
import { deleteLink, insertLinks } from "../db/models/link";
import { createProduct, ProductItem, getProductBySku } from "../db/models/product";
import { extractSKUFromUrl } from "../utils/helpers";
import { readLinksFromCsv } from "../utils/csvHelper";
import { insertPostedLink, postedLinkExist } from "../db/models/postedLink";

interface cookie {
  name: string,
  value: string,
  domain: string;
  path: string;
  expires: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite: "Strict" | "Lax" | "None";
}

(async () => {
  await connectToDatabase();
  const token = await refreshAccessToken();
  if (!token) throw new Error("No fue posible obtener el token");

  const usdRate = await getUsdToCopRate();
  if (!usdRate) throw new Error("No fue posible obtener el precio del dolar");

  // const config = await readJSON("data/config.json")

  // const categoryId = config["category_id"];
  // const url = config["url"]

  // const defaultWeight = await input("Ingrese un peso por defecto para la categoría: ")

  const linkList = await readLinksFromCsv()

  const defaultWeight = 1

  for (const linkElement of linkList) {

    if (await postedLinkExist(linkElement.url)) {
      console.log("link ya publicado");
      continue
    }

    const proxy = {
      server: '1T3DAUN2N4CFZG0Q88ILN2AQFQFRL802DTPBE6S6Q5SH5D52JMU0Y5ALWVICBUEEAG24JRO003NZTG8S:render_js=false@proxy.scrapingbee.com:8887'
    }


    const browser = await chromium.launch({ headless: false });

    const cookies: cookie[] = await readJSON("data/cookies.json")
    const randomUserAgent = await getRandomUserAgent()
    const context = await browser.newContext({
      userAgent: randomUserAgent, storageState: {
        cookies,
        origins: [{
          origin: "https://www.amazon.com/",
          localStorage: []
        }]
      }
    });
    const itemsPage = new ItemsPage(context);

    const url = linkElement["url"]
    const categoryId = linkElement["category"]

    await insertPostedLink({ link: url, category_id: categoryId })

    const links = await itemsPage.mapAllLinks(url);

    await itemsPage.descompose();

    console.log("Links encontrados:", links.length);

    await insertLinks(links, categoryId)

    let postedProducts = 0;
    let errorsCount = 0;
    let maxWorkers = 4;

    const contextPool: BrowserContext[] = [];

    for (let i = 0; i < maxWorkers; i++) {
      const userAgent = await getRandomUserAgent()
      contextPool.push(await browser.newContext({
        userAgent, storageState: {
          cookies, origins: [{
            origin: "https://www.amazon.com/",
            localStorage: []
          }]
        }
      }));
    }

    const scrapeItem = async (link: string): Promise<Product> => {
      const sku = extractSKUFromUrl(link)
      if (sku) {
        const item = await getProductBySku(sku)
        if (item) {
          console.log("producto duplicado");
          return new Product({ title: "", price: 0, description: "", sku: "" })
          // const {_id, ...data} = item
          // try {
          //   const { product_id, ml_price } = await postProduct(
          //     data,
          //     token,
          //     usdRate
          //   );
          // } catch (error) {

          // }

        }
      }

      let attemp = 1;
      let newContext: BrowserContext | undefined = undefined;
      let itemPage: ItemPage | undefined = undefined;
      while (attemp < 4) {
        try {
          newContext = contextPool.pop() || (await browser.newContext());
          if (!newContext)
            throw new Error("Error obteniendo contexto de contextPool");
          itemPage = new ItemPage(newContext);
          await itemPage.navigateTo(link);
          const pageData = await runWithTimeout(itemPage.getPageData(), 20000);
          await itemPage.descompose();
          contextPool.push(newContext);
          if (!pageData.checkWeight()) {
            console.log("Setting default weight");
            pageData.setWeight(`${defaultWeight} lb`)
          }
          await pageData.setCategoryId(categoryId);
          pageData.correctTittle();
          pageData.correctDescription();

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
          await deleteLink(link)
          // saveData({data: pageData, ml_price}, 'data/products.json')
          postedProducts++;

          console.log(`${postedProducts} publicados de ${links.length} - ${errorsCount} productos omitidos`);
          return pageData;
        } catch (error) {
          errorsCount++
          if (newContext)
            contextPool.unshift(newContext);
          if (itemPage) {
            itemPage.descompose();
          }
          if (error instanceof Error && error.message === "Operation timed out") {
            attemp++;
            continue;
          }
          try {
            saveData(
              { error: error instanceof Error ? error.message : "", link, categoryId },
              "data/errors.json"
            )
          } catch (error) {

          }
          // await newContext?.close();
          throw error;
        }
      }
      // if (newContext) {
      //   contextPool.push(newContext);
      // }

      throw new Error("Max retries reached");
    };

    try {
      await runTasksVoid<string, Product>(links, scrapeItem, maxWorkers);
    } catch (error) {
      console.error("Error durante la ejecución de tareas:", error);
    } finally {
      for (const context of contextPool) {
        await context.close();
      }
      await browser.close();
    }
  }

  // console.log(`${postedProducts} publicados de ${links.length}`);

  process.exit(0);
})();
