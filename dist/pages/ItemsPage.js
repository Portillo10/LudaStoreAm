"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemsPage = void 0;
const BasePage_1 = require("./BasePage");
const flitersHelper_1 = require("../utils/flitersHelper");
const helpers_1 = require("../utils/helpers");
const product_1 = require("../db/models/product");
class ItemsPage extends BasePage_1.BasePage {
    async getNextPageLink() {
        const nextButtonSelector = "a.s-pagination-item.s-pagination-next.s-pagination-button.s-pagination-separator";
        const nextPageButton = await this.openPage?.$(nextButtonSelector);
        const nextPageLink = await nextPageButton?.getAttribute("href");
        return nextPageLink ? `https://www.amazon.com/${nextPageLink}` : null;
    }
    async getLinks() {
        const itemSelector = 'div[data-component-type="s-search-result"]';
        const linksList = await this.openPage?.$$eval(itemSelector, (items) => {
            const titleSelector = 'div[data-cy="title-recipe"]';
            const priceSelector = 'div[data-cy="price-recipe"] span.a-price';
            const allowItems = items.filter((item) => {
                const price = item.querySelector(priceSelector)?.textContent;
                if (!price) {
                    console.log("Omitido - Producto no disponibe");
                }
                return price ? true : false;
            });
            return allowItems
                .map((item) => {
                const titleRecipe = item.querySelector(titleSelector);
                const sku = item.getAttribute("data-asin");
                const title = titleRecipe?.textContent;
                const link = titleRecipe?.querySelector("a")?.href;
                return { title, link, sku };
            })
                .filter((item) => item.title && item.link && item.link != "javascript:void(0)");
        });
        console.log(linksList?.length, "productos encontrados en la página");
        const result = [];
        if (!linksList)
            return [];
        let count = 0;
        for (const item of linksList) {
            const sku = (0, helpers_1.extractSKUFromUrl)(item.link || "");
            const product = await (0, product_1.getProductBySku)(sku || "");
            if (product || result.includes(`https://www.amazon.com/-/es/dp/${item.sku}`)) {
                count++;
            }
            else if (!(0, flitersHelper_1.isForbiddenProduct)(item.title)) {
                result.push(`https://www.amazon.com/-/es/dp/${item.sku}`);
            }
        }
        console.log(`${count} repetidos`);
        return result;
    }
    async mapAllLinks(baseUrl) {
        let nextUrl = baseUrl;
        const productLinks = [];
        while (nextUrl) {
            await this.navigateTo(nextUrl);
            let newLinks = await this.getLinks();
            productLinks.push(...newLinks);
            nextUrl = await this.getNextPageLink();
            console.log(`${productLinks.length} productos extraídos`);
            if (productLinks.length >= 1500) {
                break;
            }
        }
        return productLinks;
    }
    async mapAllLinks2(task) {
        while (task.currentUrl) {
            await this.navigateTo(task.currentUrl);
            let newLinks = await this.getLinks();
            const currentUrl = await this.getNextPageLink();
            task.loadLinks(newLinks);
            await task.setCurrentUrl(currentUrl);
            console.log(`${task.linkList.length} productos extraídos`);
            if (task.linkList.length >= 1800) {
                await task.setCurrentUrl(null);
                break;
            }
        }
    }
}
exports.ItemsPage = ItemsPage;
