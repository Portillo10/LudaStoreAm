"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const playwright_1 = require("playwright");
const ItemsPage_1 = require("../pages/ItemsPage");
const ItemPage_1 = require("../pages/ItemPage");
const taskExecutor_1 = require("../utils/taskExecutor");
const jsonHelper_1 = require("../utils/jsonHelper");
const database_1 = require("../db/database");
const product_1 = require("../db/models/product");
const helpers_1 = require("../utils/helpers");
const csvHelper_1 = require("../utils/csvHelper");
const postedLink_1 = require("../db/models/postedLink");
const error_1 = require("../db/models/error");
const axios_1 = require("axios");
const taskManager_1 = require("../models/taskManager");
const scrapingBeeError_1 = require("../errors/scrapingBeeError");
(async () => {
    await (0, database_1.connectToDatabase)();
    // let token = await refreshAccessToken("LudaStore");
    // if (!token) throw new Error("No fue posible obtener el token");
    // const usdRate = await getUsdToCopRate();
    // if (!usdRate) throw new Error("No fue posible obtener el precio del dolar");
    const linkList = await (0, csvHelper_1.readLinksFromCsv)();
    let totalProducts = 0;
    let limit = 1500;
    const browser = await playwright_1.chromium.launch({ headless: false });
    const cookies = await (0, jsonHelper_1.readJSON)("data/cookies.json");
    const taskList = await taskManager_1.Task.getTasks(linkList);
    for (const task of taskList) {
        // if (totalProducts >= limit) {
        //   token = await refreshAccessToken("LudaStore");
        //   limit += 1500;
        // }
        if (await (0, postedLink_1.postedLinkExist)(task.mainUrl)) {
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
        const randomUserAgent = await (0, jsonHelper_1.getRandomUserAgent)();
        const context = await browser.newContext({
            userAgent: randomUserAgent,
            ignoreHTTPSErrors: true,
        });
        const itemsPage = new ItemsPage_1.ItemsPage(context);
        try {
            await itemsPage.mapAllLinks2(task);
        }
        catch (error) {
            if ((0, axios_1.isAxiosError)(error)) {
                console.log(error.response?.data);
            }
            else {
                console.log(error);
            }
        }
        await itemsPage.descompose();
        console.log("Links encontrados:", task.linkList.length);
        totalProducts += task.linkList.length;
        let postedProducts = 0;
        let errorsCount = 0;
        let maxWorkers = 4;
        const contextPool = [];
        for (let i = 0; i < maxWorkers; i++) {
            const userAgent = await (0, jsonHelper_1.getRandomUserAgent)();
            contextPool.push(await browser.newContext({
                userAgent,
                ignoreHTTPSErrors: true,
            }));
        }
        const scrapeItem = async (link) => {
            const sku = (0, helpers_1.extractSKUFromUrl)(link);
            if (sku) {
                const item = await (0, product_1.getProductBySku)(sku);
                if (item) {
                    return null;
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
                    const pageData = await (0, taskExecutor_1.runWithTimeout)(itemPage.getPageData(), 12000);
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
                    let data;
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
                        console.log(`${postedProducts} publicados de ${task.linkList.length} - ${errorsCount} productos omitidos`);
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
                    await task.addSku(data.sku || "");
                    await task.deleteLinkElement(link);
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
            await (0, taskExecutor_1.runTasksVoid)(task.linkList, scrapeItem, maxWorkers);
        }
        catch (error) {
            console.error("Error durante la ejecución de tareas:", error);
        }
        finally {
            for (const context of contextPool) {
                await context.close();
            }
        }
        await (0, postedLink_1.insertPostedLink)({
            link: task.mainUrl,
            category_id: task.category_id,
            updated: false,
            skuList: task.skuList,
        });
        await task.endTask();
        console.log(`${postedProducts} publicados de ${task.linkList.length}`);
    }
    await browser.close();
    process.exit(0);
})();
