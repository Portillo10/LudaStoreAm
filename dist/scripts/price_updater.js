"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const helpers_1 = require("../utils/helpers");
const axios_1 = require("axios");
const database_1 = require("../db/database");
const product_1 = require("../db/models/product");
const putPrice_1 = require("../services/putPrice");
const store_1 = require("../db/models/store");
const auth_1 = require("../services/auth");
const forex_1 = require("../services/forex");
const mlItems_1 = require("../services/mlItems");
const productStore_1 = require("../db/models/productStore");
(async () => {
    await (0, database_1.connectToDatabase)();
    const store = await (0, store_1.getStoreByAlias)("LudaStore");
    let token = await (0, auth_1.refreshAccessToken)(store.alias);
    if (!token)
        throw new Error("Error obteniendo token de acceso");
    let usdRate = await (0, forex_1.getUsdToCopRate)();
    if (!usdRate)
        throw new Error("Error obteniendo precio del dolar");
    const products = await (0, productStore_1.getProducStore)({ store_id: store._id });
    //   const products = await getProducts({
    //     sku: { $in: store.skuList.map((item) => item.sku) },
    //     state: "updated",
    //   });
    //   console.log(products.length);
    //   const productList = products.reduce((acc, value) => {
    //   }, {});
    let updated = 0;
    for (const item of products) {
        const product = await (0, product_1.getProduct)({ sku: item.productSku, state: "updated" }, {
            projection: {
                pictures: 0,
                attributes: 0,
                description: 0,
                title: 0,
            },
        });
        if (product && item.item_id) {
            console.log(item.item_id);
            try {
                const newPrice = await (0, putPrice_1.calculatePrice)(product, token, usdRate);
                // console.log(newPrice);
                // console.log(item.sku);
                await (0, mlItems_1.updatePrice)(token, item.item_id, newPrice["unit_price"]);
                await (0, product_1.updateProduct)({ _id: product._id }, { $set: { state: "active" } });
                updated++;
                console.log(`${updated} productos actualizados`);
            }
            catch (error) {
                if ((0, axios_1.isAxiosError)(error)) {
                    console.log(error.response?.data.message);
                }
                else {
                    console.log(error);
                }
            }
            await (0, helpers_1.sleep)(500);
        }
    }
    process.exit(0);
})();
