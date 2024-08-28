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
const inputHelper_1 = require("../utils/inputHelper");
(async () => {
    await (0, database_1.connectToDatabase)();
    let token = await (0, auth_1.refreshAccessToken)();
    if (!token)
        throw new Error("No fue posible obtener el token");
    const usdRate = await (0, forex_1.getUsdToCopRate)();
    if (!usdRate)
        throw new Error("No fue posible obtener el precio del dolar");
    const products = await (0, product_1.getErrorProducts)();
    console.log(products.length);
    await (0, inputHelper_1.input)("Desea continuar?");
    let posted = 0;
    for (const product of products) {
        // if (posted % 1000 == 0){
        //     token = await refreshAccessToken();
        // }
        try {
            const { _id, ...itemData } = product;
            const productData = new Product_1.Product({
                title: "",
                price: 0,
                description: "",
                sku: "",
            });
            productData.setData(itemData);
            const { product_id, ml_price } = await (0, pubs_1.postProduct)(productData, token, usdRate);
            if (!product.sku)
                throw new Error("Sku no disponible");
            await (0, product_1.activateProduct)(product.sku, product_id);
            posted++;
        }
        catch (error) {
            await (0, error_1.insertError)({
                category_id: product.category_id || "",
                errorMsg: "Error publicando producto",
                link: `http://amazon.com/-/es/dp/${product.sku}`,
                errorTime: new Date(),
            });
        }
        await (0, helpers_1.sleep)(500);
    }
})();
