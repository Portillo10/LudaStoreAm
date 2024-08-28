"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemPage = void 0;
const BasePage_1 = require("./BasePage");
const Product_1 = require("../models/Product");
const helpers_1 = require("../utils/helpers");
class ItemPage extends BasePage_1.BasePage {
    async getTitle() {
        const title = await (await this.selectOne(["#productTitle"]))?.textContent();
        if (title) {
            return title.trim();
        }
        else {
            throw new Error("Título no disponible");
        }
    }
    async getDetails() {
        const detailSelectors = [
            {
                selector: "div.a-fixed-left-grid.product-facts-detail",
                keySelector: "div.a-col-left span.a-color-base",
                valueSelector: "div.a-col-right span.a-color-base",
            },
            {
                selector: "table tbody tr.a-spacing-small",
                keySelector: "td.a-span3 span",
                valueSelector: "td.a-span9 span",
            },
            {
                selector: "#twister div.a-row",
                keySelector: "label",
                valueSelector: "span",
            },
        ];
        for (const selector of detailSelectors) {
            const detailsElements = await this.openPage?.$$(selector.selector);
            const elementsCount = detailsElements?.length;
            if (detailsElements && elementsCount && elementsCount > 0) {
                const details = {};
                for (let i = 0; i < elementsCount; i++) {
                    const element = detailsElements[i];
                    // const key = await element
                    //   .locator(selector.keySelector)
                    //   .first()
                    //   .textContent();
                    // const value = await element
                    //   .locator(selector.valueSelector)
                    //   .first()
                    //   .textContent();
                    const key = await (await element.$(selector.keySelector))?.textContent();
                    const value = await (await element.$(selector.valueSelector))?.textContent();
                    if (key && value) {
                        details[key.trim()] = value.trim();
                    }
                }
                return details;
            }
        }
        return {};
    }
    async getPrice() {
        const priceSelectors = [
            "#corePriceDisplay_desktop_feature_div span.a-price.aok-align-center.reinventPricePriceToPayMargin.priceToPay",
            "#corePrice_desktop span.a-offscreen",
            "#corePrice_feature_div span.a-offscreen",
            "#corePriceDisplay_desktop_feature_div span.aok-offscreen",
        ];
        const price = await (await this.selectOne(priceSelectors))?.textContent();
        if (price) {
            const finalPrice = price.trim().split("$")[1].replace(",", "");
            return Number(finalPrice);
        }
        else {
            throw new Error("Precio no disponible");
        }
    }
    async getSpecs() {
        const specsSelectors = [
            "#technicalSpecifications_feature_div tr",
            "#productDetails_techSpec_section_1 tr",
            "#productDetails_detailBullets_sections1 tr",
            "#detailBullets_feature_div li span",
        ];
        const specsElements = await this.selectAll(specsSelectors);
        if (!specsElements)
            throw new Error("Especificaciones no disponibles");
        const specs = await this.convertElementsToDict(specsElements);
        if (!specs)
            throw new Error("Error extrayendo especificaciones");
        return specs;
    }
    async getDescription() {
        const descriptionSelectors = [
            "#feature-bullets ul li",
            "ul span li span.a-list-item.a-size-base.a-color-base",
        ];
        // const descriptionLocator = await this.selectAll(descriptionSelectors);
        // const descriptionElements = await descriptionLocator?.evaluateAll( elements => elements.map((element) => element.textContent));
        const descriptionElements = await this.selectAll(descriptionSelectors);
        if (descriptionElements && descriptionElements?.length > 0) {
            return (await Promise.all(descriptionElements.map(async (element) => {
                return await element.textContent();
            })))
                .filter((text) => text !== null)
                .join("\n");
        }
        else {
            return "";
        }
    }
    async getImgSources() {
        const imgAlts = this.openPage?.locator("#altImages li.imageThumbnail input");
        if (!imgAlts || (await imgAlts?.count()) < 1)
            throw new Error("Imágenes no disponibles");
        const imgCount = await imgAlts.count();
        for (let i = 0; i < imgCount; i++) {
            try {
                await imgAlts.nth(i).hover();
            }
            catch (error) {
                continue;
            }
        }
        // const imgs = await this.openPage
        //   ?.locator("div.imgTagWrapper img.a-dynamic-image")
        //   .evaluateAll((elements) => {
        //     return elements.map((element) => element.getAttribute("src"));
        //   });
        const imgs = await this.openPage?.$$eval("div.imgTagWrapper img.a-dynamic-image", (elements) => {
            return elements.map((element) => element.getAttribute("src"));
        });
        if (!imgs || imgs.length < 1) {
            throw new Error("Images not available");
        }
        const imgSources = (await Promise.all(imgs.map(async (img) => {
            const splitedSrc = img?.split("._AC_");
            if (!splitedSrc) {
                return { source: null };
            }
            const mainSrc = splitedSrc[0];
            let newSrc = "";
            if (splitedSrc.length < 2) {
                const [first, second] = mainSrc.split("._S");
                if (!second) {
                    newSrc = mainSrc;
                }
                else {
                    newSrc = `${first}._SL1200_.jpg`;
                }
            }
            else {
                newSrc = `${mainSrc}._AC_SL1200_.jpg`;
            }
            if (await (0, helpers_1.allowImageSize)(newSrc)) {
                return { source: newSrc };
            }
            else {
                console.log("La imágen no cumple con el tamaño mínimo");
                return { source: null };
            }
        }))).filter((img) => img.source !== null);
        if (imgSources.length === 0) {
            throw new Error("No images avalible");
        }
        return imgSources;
    }
    async getWeight() {
        const productOverView = await this.openPage?.$("#productOverview_feature_div");
        const detailsSquare = await this.openPage?.$("#glance_icons_div");
        let text = "";
        if (detailsSquare) {
            text = await detailsSquare.textContent();
        }
        else if (productOverView) {
            text = await productOverView.textContent();
        }
        if (!text)
            throw new Error("No es posible extraer el peso");
        const weight = (0, helpers_1.extractWeightFromText)(text);
        return weight;
    }
    async getPageData() {
        if (!this.currentUrl)
            throw new Error("No se pudo obtener la url de la página.");
        const sku = (0, helpers_1.extractSKUFromUrl)(this.currentUrl);
        const title = this.cheerio?.getTitle();
        if (!title) {
            // await input("Title not found, press any key")
            throw new Error(`Title not found for ${sku}`);
        }
        const price = this.cheerio?.getPrice();
        if (!price) {
            // await input("Press any key")
            throw new Error(`Price not found for ${sku}`);
        }
        const description = this.cheerio?.getDescription();
        // if (!description) throw new Error("Description not found");
        const details = this.cheerio?.getDetails();
        if (!details)
            throw new Error(`Details not found for ${sku}`);
        const specs = this.cheerio?.getSpecs();
        if (!specs)
            throw new Error(`Specs not found for: ${sku}`);
        const itemCondition = this.cheerio?.getItemCondition();
        const product = new Product_1.Product({
            title,
            price,
            description,
            sku,
            condition: itemCondition,
        });
        product.setAttributes(details, specs);
        if (!product.checkWeight()) {
            const weight = await this.getWeight();
            // if (!weight) throw new Error("Peso del producto no disponible");
            if (weight)
                product.setWeight(weight);
        }
        const imgSources = await this.getImgSources();
        product.setImages(imgSources);
        return product;
    }
}
exports.ItemPage = ItemPage;
