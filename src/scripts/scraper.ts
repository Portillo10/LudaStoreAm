import { config } from "dotenv";
config();
import { BrowserContext, chromium } from "playwright";
import { ItemsPage } from "../pages/ItemsPage";
import { ItemPage } from "../pages/ItemPage";
import { runTasks, runTasksVoid, runWithTimeout } from "../utils/taskExecutor";
import { Product } from "../models/Product";
import { readJSON, saveData, writeJSON } from "../utils/jsonHelper";
import { getUsdToCopRate } from "../services/forex";
import { refreshAccessToken } from "../services/auth";
import { postProduct } from "../services/pubs";
import { connectToDatabase } from "../db/database";
import { createItem, Item } from "../db/models/Item";
import { input } from "../utils/inputHelper";
import { deleteLink, insertLinks } from "../db/models/link";
import { createProduct, ProductItem, getProductBySku } from "../db/models/product";
import { extractSKUFromUrl } from "../utils/helpers";

(async () => {
  await connectToDatabase();
  const token = await refreshAccessToken();
  // const token =
  //   "APP_USR-6850630523210149-080423-a7838acbfdd2886dccde977169361c0f-1242366457";
  if (!token) throw new Error("No fue posible obtener el token");

  const usdRate = await getUsdToCopRate();
  if (!usdRate) throw new Error("No fue posible obtener el precio del dolar");

  const config = await readJSON("data/config.json")

  const categoryId = config["category_id"];
  const url = config["url"]
  console.log(categoryId, url);
  const defaultWeight = await input("Ingrese un peso por defecto para la categoría: ")

  

  const browser = await chromium.launch({ headless: true });

  const context = await browser.newContext();
  const itemsPage = new ItemsPage(context);

  const links = await itemsPage.mapAllLinks(url);

  await itemsPage.descompose();

  // const links = [
  //   "https://www.amazon.com/-/es/dp/B09YVMGGX6",
  //   "https://www.amazon.com/-/es/dp/B07N39WBS6",
  //   "https://www.amazon.com/-/es/dp/B08747VSG3",
  //   "https://www.amazon.com/-/es/dp/B0873ZMKQT"
  // ];

  // const errors:any[] = await readJSON("data/errors.json")
  // const links = errors.map(error => error.link ).filter(error => error.error === "Request failed with status code 401")

  // await writeJSON("data/errors.json", [])

  console.log("Links encontrados:", links.length);

  await insertLinks(links, categoryId)


  let postedProducts = 0;
  let errorsCount = 0;
  let maxWorkers = 4;

  const contextPool: BrowserContext[] = [];

  for (let i = 0; i < maxWorkers; i++) {
    contextPool.push(await browser.newContext());
  }

  const scrapeItem = async (link: string): Promise<Product> => {

    const sku = extractSKUFromUrl(link)
    if (sku){
      const item = await getProductBySku(sku)
      if (item){
        console.log("producto duplicado");
        return new Product({title:"", price:0, description:"", sku:""})
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
    if (newContext) {
      contextPool.push(newContext);
    }

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
  // console.log(`${postedProducts} publicados de ${links.length}`);

  process.exit(0);
})();
