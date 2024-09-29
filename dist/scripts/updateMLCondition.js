"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const database_1 = require("../db/database");
const product_1 = require("../db/models/product");
const helpers_1 = require("../utils/helpers");
const mlItems_1 = require("../services/mlItems");
const auth_1 = require("../services/auth");
const categories = [
    "MCO38942",
    "MCO1015",
    "MCO3691",
    "MCO6872",
    "MCO167791",
    "MCO4707",
    "MCO1042",
    "MCO114643",
    "MCO50217",
    "MCO7908",
    "MCO417788",
    "MCO4192",
    "MCO8431",
    "MCO4702",
    "MCO59824",
    "MCO403380",
    "MCO11889",
    "MCO40736",
    "MCO3697",
    "MCO14903",
    "MCO176837",
    "MCO3384",
    "MCO441996",
    "MCO87920",
    "MCO416860",
    "MCO180784",
    "MCO116348",
    "MCO412007",
    "MCO177998",
    "MCO442223",
    "MCO173788",
    "MCO414014",
    "MCO177999",
    "MCO176296",
    "MCO424978",
    "MCO178000",
    "MCO116352",
    "MCO173824",
    "MCO87926",
    "MCO412401",
    "MCO441494",
    "MCO4275",
    "MCO29465",
    "MCO3018",
    "MCO180028",
    "MCO8436",
    "MCO3011",
    "MCO166528",
    "MCO4633",
    "MCO442189",
    "MCO1014",
    "MCO417360",
    "MCO8937",
    "MCO3770",
    "MCO442129",
    "MCO3772",
    "MCO442023",
    "MCO166576",
    "MCO166465",
    "MCO416667",
    "MCO416668",
    "MCO372121",
    "MCO8456",
    "MCO3014",
    "MCO6645",
];
(async () => {
    await (0, database_1.connectToDatabase)();
    let token = await (0, auth_1.refreshAccessToken)("LudaStore");
    const products = await (0, product_1.getRefurbishedByCategories)(categories);
    console.log(products.length);
    for (const product of products) {
        console.log(product.sku);
        if (!product.item_id)
            continue;
        if (!product.sku)
            continue;
        try {
            await (0, mlItems_1.deleteItemById)(product.item_id, token);
            await (0, product_1.setError)(product.sku);
        }
        catch (error) { }
        await (0, helpers_1.sleep)(700);
    }
})();
