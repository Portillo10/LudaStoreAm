"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const playwright_1 = require("playwright");
const ItemPage_1 = require("../pages/ItemPage");
const taskExecutor_1 = require("../utils/taskExecutor");
const jsonHelper_1 = require("../utils/jsonHelper");
const database_1 = require("../db/database");
const product_1 = require("../db/models/product");
const helpers_1 = require("../utils/helpers");
const csvHelper_1 = require("../utils/csvHelper");
const error_1 = require("../db/models/error");
const scrapingBeeError_1 = require("../errors/scrapingBeeError");
const productStore_1 = require("../db/models/productStore");
const toscrape_1 = require("../db/models/toscrape");
(async () => {
    await (0, database_1.connectToDatabase)();
    const linkList = await (0, csvHelper_1.readLinksFromCsv)();
    let totalProducts = 0;
    let limit = 1500;
    const browser = await playwright_1.chromium.launch({ headless: true });
    const cookies = await (0, jsonHelper_1.readJSON)("data/cookies.json");
    // const productStore = (await getProducts({ }, {})).map(
    //   (el) => el.sku || ""
    // );
    const skuList = await (0, toscrape_1.getToScrape)({});
    // await deleteScrape({ sku: { $in: productStore } }, {});
    // const taskList = await Task.getTasks(linkList);
    // await input("continue");
    const taskList = ["a"];
    const weightEnum = {
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
        const randomUserAgent = await (0, jsonHelper_1.getRandomUserAgent)();
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
        const contextPool = [];
        for (let i = 0; i < maxWorkers; i++) {
            const userAgent = await (0, jsonHelper_1.getRandomUserAgent)();
            contextPool.push(await browser.newContext({
                userAgent,
                ignoreHTTPSErrors: true,
            }));
        }
        // const skuList: string[] = await readJSON("data/toScrape.json");
        const scrapeItem = async (link) => {
            const errorExist = await (0, error_1.getError)({ link });
            if (errorExist)
                return null;
            const sku = (0, helpers_1.extractSKUFromUrl)(link);
            const category_id = skuList.find((el) => el.sku == sku)?.category_id;
            if (postedProducts < 5) {
                console.log(category_id, weightEnum[category_id || ""]);
            }
            if (sku == "B08CS1X53V" ||
                sku == "B0D6GXKKF6" ||
                sku == "B077PK2GBT" ||
                sku == "B08FX6Q4H3") {
                return null;
            }
            if (sku) {
                const productStore = await (0, productStore_1.getOneProducStore)({ productSku: sku });
                if (productStore?.state != "active") {
                    console.log("producto inactivo");
                    return null;
                }
                const item = await (0, product_1.getProductBySku)(sku);
                if (item) {
                    throw new Error("Producto duplicado");
                }
            }
            let attemp = 1;
            let newContext = undefined;
            let itemPage = undefined;
            while (attemp <= 3) {
                try {
                    newContext =
                        contextPool.pop() ||
                            (await browser.newContext({
                                ignoreHTTPSErrors: true,
                            }));
                    if (!newContext)
                        throw new Error("Error obteniendo contexto de contextPool");
                    itemPage = new ItemPage_1.ItemPage(newContext);
                    await itemPage.navigateTo(link);
                    const pageData = await (0, taskExecutor_1.runWithTimeout)(itemPage.getPageData(), 16000);
                    await itemPage.descompose();
                    contextPool.push(newContext);
                    if (!pageData.checkWeight()) {
                        console.log("Setting default weight");
                        pageData.setDefaultWeight(`${weightEnum[category_id || ""]} lb`);
                    }
                    await pageData.setCategoryId(category_id || "");
                    pageData.correctTittle();
                    pageData.correctDescription();
                    let data;
                    try {
                        data = {
                            ...pageData.getItemInfo(),
                            item_id: null,
                            state: "pending",
                        };
                        postedProducts++;
                    }
                    catch (error) {
                        data = {
                            ...pageData.getItemInfo(),
                            item_id: null,
                            state: "error",
                        };
                        errorsCount++;
                    }
                    await (0, product_1.createProduct)(data);
                    console.log(`${sku} ${postedProducts} publicados de ${skuList.length} - ${errorsCount} productos omitidos`);
                    await (0, jsonHelper_1.saveData)(sku, "data/scraped.json");
                    // await task.addSku(data.sku || "");
                    // await task.deleteLinkElement(link);
                    return pageData;
                }
                catch (error) {
                    if (newContext)
                        contextPool.unshift(newContext);
                    if (itemPage) {
                        itemPage.descompose();
                    }
                    if (error instanceof scrapingBeeError_1.ScrapingBeeError) {
                        process.exit(0);
                    }
                    if (error instanceof Error &&
                        error.message === "Operation timed out" &&
                        attemp < 3) {
                        attemp++;
                        continue;
                    }
                    try {
                        await (0, error_1.insertError)({
                            errorMsg: error instanceof Error ? error.message : "",
                            link,
                            category_id: task.category_id || "",
                            errorTime: new Date(),
                        });
                    }
                    catch (error) { }
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
            await (0, taskExecutor_1.runTasksVoid)(skuList.map((sku) => `https://www.amazon.com/-/es/dp/${sku.sku}`), scrapeItem, maxWorkers);
        }
        catch (error) {
            console.error("Error durante la ejecución de tareas:", error);
        }
        finally {
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
