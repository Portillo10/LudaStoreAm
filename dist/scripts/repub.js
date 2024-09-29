"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const database_1 = require("../db/database");
const error_1 = require("../db/models/error");
const product_1 = require("../db/models/product");
const Product_1 = require("../models/Product");
const auth_1 = require("../services/auth");
const forex_1 = require("../services/forex");
const pubs_1 = require("../services/pubs");
const helpers_1 = require("../utils/helpers");
const store_1 = require("../db/models/store");
const productStore_1 = require("../db/models/productStore");
const attributesHelper_1 = require("../utils/attributesHelper");
const flitersHelper_1 = require("../utils/flitersHelper");
(async () => {
    await (0, database_1.connectToDatabase)();
    const store = await (0, store_1.getStoreByAlias)("HouseStore");
    let token = await (0, auth_1.refreshAccessToken)(store.alias);
    // console.log(token);
    // await input("enter")
    if (!token)
        throw new Error("No fue posible obtener el token");
    const usdRate = await (0, forex_1.getUsdToCopRate)();
    if (!usdRate)
        throw new Error("No fue posible obtener el precio del dolar");
    const products = await (0, product_1.getProducts)({
        state: "omited",
        condition: "new",
        category_id: { $nin: ["MCO71419", "MCO1713"] },
    }, {});
    let posted = 0;
    let errors = 0;
    for (const product of products) {
        if (posted > 0 && posted % 3000 == 0) {
            token = await (0, auth_1.refreshAccessToken)(store.alias);
        }
        if (posted >= 4000) {
            console.log(`límite alcanzado ${posted} productos publicados`);
            break;
        }
        try {
            if (!product.sku)
                throw new Error("Sku no disponible");
            const productStore = await (0, productStore_1.getOneProducStore)({
                productSku: product.sku,
                store_id: store._id,
            });
            if (productStore) {
                console.log(product.sku);
                console.log("producto duplicado");
                continue;
            }
            const { _id, attributes, ...itemData } = product;
            if ((0, flitersHelper_1.isForbiddenProduct)(itemData.title || "") ||
                itemData.title?.toLocaleLowerCase().includes("refurbished")) {
                console.log(itemData.title);
                await (0, product_1.updateProduct)({ sku: itemData.sku }, { $set: { state: "ignored" } });
                continue;
            }
            const productData = new Product_1.Product({
                title: "",
                price: 0,
                description: "",
                sku: "",
            });
            const newAttributes = await (0, attributesHelper_1.stealthAttributes)(itemData.category_id || "", attributes);
            const { description, ...restData } = itemData;
            productData.setData({
                ...restData,
                attributes: newAttributes,
                description: (0, helpers_1.removeContactInfo)((0, flitersHelper_1.cleanText)(description)),
            });
            const { product_id, ml_price } = await (0, pubs_1.postProduct)(productData, token, usdRate);
            await (0, productStore_1.insertProductStore)({
                productSku: product.sku,
                store_id: store._id,
                item_id: product_id,
                state: "active",
            });
            await (0, product_1.updateState)(product.sku, "active");
            posted++;
            console.log(`${posted} productos publicados, ${errors} omitidos`);
        }
        catch (error) {
            await (0, error_1.insertError)({
                category_id: product.category_id || "",
                errorMsg: "Error publicando producto",
                link: `http://amazon.com/-/es/dp/${product.sku}`,
                errorTime: new Date(),
            });
            await (0, product_1.updateState)(product.sku || "", "omited");
            errors++;
        }
        // await input("continue");
    }
    process.exit(0);
})();
