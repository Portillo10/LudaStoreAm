import { config } from "dotenv";
config();

import { createProduct, ProductItem, getProductBySku } from "../src/db/models/product";
import { runTasks, runTasksVoid, runWithTimeout } from "../src/utils/taskExecutor";
import { getAllItems, getItemBySku } from "../src/db/models/Item";
import { connectToDatabase } from "../src/db/database";
import { getRandomUserAgent, readJSON } from "../src/utils/jsonHelper";
import { BrowserContext, chromium } from "playwright";
import { ItemPage } from "../src/pages/ItemPage";
import { Product } from "../src/models/Product"
import { extractSKUFromUrl } from "../src/utils/helpers";


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

    // const config = await readJSON("data/config.json")

    // const categoryId = config["category_id"];
    // const url = config["url"]

    // const defaultWeight = await input("Ingrese un peso por defecto para la categoría: ")

    const defaultWeight = 1

    const proxy = {
        server: "https://proxy.scrapingbee.com:8887",
        username: "1T3DAUN2N4CFZG0Q88ILN2AQFQFRL802DTPBE6S6Q5SH5D52JMU0Y5ALWVICBUEEAG24JRO003NZTG8S",
        password: "render_js=false&stealth_proxy=false&premium_proxy=false"
    }

    const cookies: cookie[] = await readJSON("data/cookies.json")

    const storageState = {
        cookies,
        origins: [{
            origin: "https://www.amazon.com/",
            localStorage: []
        }]
    }

    const browser = await chromium.launch({ headless: true });

    const randomUserAgent = await getRandomUserAgent()
    const context = await browser.newContext({
        userAgent: randomUserAgent, ignoreHTTPSErrors: true
    });

    // await insertPostedLink({ link: url, category_id: categoryId })

    const items = await getAllItems()

    const links = items.map((item) =>
        `https://www.amazon.com/-/es/dp/${item.sku}`
    );

    console.log("Links encontrados:", links.length);

    // await insertLinks(links, categoryId)

    let postedProducts = 0;
    let errorsCount = 0;
    let maxWorkers = 4;

    const contextPool: BrowserContext[] = [];

    for (let i = 0; i < maxWorkers; i++) {
        const userAgent = await getRandomUserAgent()
        contextPool.push(await browser.newContext({
            userAgent, ignoreHTTPSErrors: true
        }));
    }

    const scrapeItem = async (link: string): Promise<Product> => {
        const sku = extractSKUFromUrl(link)
        let item = await getItemBySku(sku || '')
        if (!item) throw new Error("Error con el item")
        // if (sku) {
        //     item = await getProductBySku(sku)
        //     if (item) {
        //         console.log("producto duplicado");
        //         return new Product({ title: "", price: 0, description: "", sku: "" })
                // const {_id, ...data} = item
                // try {
                //   const { product_id, ml_price } = await postProduct(
                //     data,
                //     token,
                //     usdRate
                //   );
                // } catch (error) {

                // }
        //     }
        // }

        let attemp = 1;
        let newContext: BrowserContext | undefined = undefined;
        let itemPage: ItemPage | undefined = undefined;
        while (attemp < 4) {
            try {
                newContext = contextPool.pop() || (await browser.newContext({
                    ignoreHTTPSErrors: true
                }));
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
                await pageData.setCategoryId("MCO180917");
                pageData.correctTittle();
                pageData.correctDescription();

                // const { product_id, ml_price } = await postProduct(
                //   pageData,
                //   token,
                //   usdRate
                // );
                const data: ProductItem = {
                  ...pageData.getItemInfo(),
                  item_id: item.item_id,
                  state: "active",
                };

                await createProduct(data);
                // await deleteLink(link)
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
                    console.log(`Error extrayendo producto intento #${attemp}`);
                    continue;
                }
                try {
                    //   saveData(
                    //     { error: error instanceof Error ? error.message : "", link, categoryId },
                    //     "data/errors.json"
                    //   )
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

    console.log(`${postedProducts} publicados de ${links.length}`);

    process.exit(0);
})();