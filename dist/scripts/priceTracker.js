"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const database_1 = require("../db/database");
const postedLink_1 = require("../db/models/postedLink");
const scrapingBeeClient_1 = require("../utils/scrapingBeeClient");
const cheerio_1 = require("cheerio");
const product_1 = require("../db/models/product");
const helpers_1 = require("../utils/helpers");
const taskExecutor_1 = require("../utils/taskExecutor");
const getPriceBySku = async (sku) => {
    const url = `https://www.amazon.com/-/es/dp/${sku}`;
    const content = await (0, scrapingBeeClient_1.fetchPageContent)(url);
    const $ = (0, cheerio_1.load)(content);
    const selectors = [
        "#corePriceDisplay_desktop_feature_div span.a-price.aok-align-center.reinventPricePriceToPayMargin.priceToPay",
        "#corePrice_desktop span.a-offscreen",
        "#corePrice_feature_div span.a-offscreen",
        "#corePriceDisplay_desktop_feature_div span.aok-offscreen",
    ];
    const theSelector = selectors.join(", ");
    const priceElement = $(theSelector).eq(0);
    if (priceElement.length > 0) {
        const priceText = priceElement
            .text()
            .trim()
            .split("$")[1]
            .replace("US", "");
        return parseFloat(priceText);
    }
    else {
        return null;
    }
};
const scrapePage = (content) => {
    const $ = (0, cheerio_1.load)(content);
    const itemElements = $('[data-component-type="s-search-result"]');
    const items = [];
    itemElements.each((i, element) => {
        const sku = $(element).attr("data-asin");
        try {
            if (!sku)
                throw new Error("No se encontró sku para el elemento");
            const priceElement = $(element).find("[data-cy='price-recipe']");
            let price = null;
            if (priceElement.length > 0 &&
                priceElement.text().split("$").length > 1) {
                const priceText = priceElement
                    .text()
                    .split("$")[1]
                    .replace(",", "")
                    .replace("US", "");
                price = parseFloat(priceText);
            }
            items.push({ sku, price });
        }
        catch (error) {
            console.log(error);
        }
    });
    const nextPageSelector = "a.s-pagination-item.s-pagination-next.s-pagination-button.s-pagination-separator";
    const nextPageElement = $(nextPageSelector);
    let nextUrl = null;
    if (nextPageElement.length > 0) {
        const href = nextPageElement.attr("href");
        nextUrl = `https://www.amazon.com/${href}`;
    }
    return { items, nextUrl };
};
const trackPrice = async (link) => {
    console.log(link.category_id);
    const limit = 1500;
    if (!link.link)
        throw new Error();
    let currentUrl = link.link;
    let emptyPages = 0;
    while (currentUrl) {
        if (link.skuList.length >= limit) {
            console.log("límite alcanzado");
            break;
        }
        const content = await (0, scrapingBeeClient_1.fetchPageContent)(currentUrl);
        const { items, nextUrl } = scrapePage(content);
        currentUrl = nextUrl;
        let itemsPerPage = 0;
        for (const item of items) {
            const product = await (0, product_1.getProduct)({ sku: item.sku }, {
                projection: { pictures: 0, attributes: 0, description: 0 },
            });
            if (product && !link.skuList.includes(item.sku)) {
                itemsPerPage++;
                link.skuList.push(item.sku);
                if (!item.price) {
                    await (0, product_1.updateProduct)({ _id: product._id }, { $set: { state: "unavailable" } });
                }
                else if (item.price != product.price) {
                    console.log(item.sku, item.price);
                    await (0, product_1.updateProduct)({ _id: product._id }, { $set: { state: "updated", price: item.price } });
                }
            }
        }
        if (itemsPerPage == 0) {
            emptyPages++;
            //   console.log("no se encontraron items en esta página");
        }
        else {
            emptyPages = 0;
        }
        if (emptyPages >= 6) {
            break;
        }
        await (0, helpers_1.sleep)(50);
    }
    await (0, postedLink_1.updatePostedLink)({ _id: link._id }, { $set: { skuList: link.skuList, lastUpdate: new Date() } });
};
(async () => {
    await (0, database_1.connectToDatabase)();
    // await countProducts()
    const postedLinks = await (0, postedLink_1.getPostedLinks)({});
    console.log(postedLinks.length);
    await (0, taskExecutor_1.runTasksVoid)(postedLinks, trackPrice, 4);
})();
