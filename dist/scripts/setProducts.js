"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const database_1 = require("../db/database");
const store_1 = require("../db/models/store");
const product_1 = require("../db/models/product");
const inputHelper_1 = require("../utils/inputHelper");
const categories = [
    'MCO180928',
    'MCO417111',
    'MCO417111',
    'MCO417111',
    'MCO1259',
    'MCO157400',
    'MCO118184',
    'MCO429392',
    'MCO429392',
    'MCO429392',
    'MCO118184',
    'MCO118184',
    'MCO157399',
    'MCO157396',
    'MCO181069',
    'MCO157398',
    'MCO157398',
    'MCO167683',
    'MCO416984',
    'MCO157396',
    'MCO167685',
    'MCO4597',
    'MCO4598',
    'MCO4597',
    'MCO180960',
    'MCO180960',
    'MCO417035',
    'MCO181090',
    'MCO181090',
    'MCO118188',
    'MCO441193',
    'MCO441193',
    'MCO441193',
    'MCO441193',
    'MCO441193',
    'MCO180969',
    'MCO180965',
    'MCO8830',
];
const run = async () => {
    await (0, database_1.connectToDatabase)();
    const store = await (0, store_1.getStoreByAlias)("LudaStore");
    if (store) {
        const products = await (0, product_1.getByCategories)(categories);
        console.log(products.length);
        const items = products
            .map((product) => ({ sku: product.sku, item_id: product.item_id }))
            .filter((item) => item.sku != null && item.item_id != null);
        console.log(items.length);
        await (0, inputHelper_1.input)("Presione enter");
        // await setProducts(items, store._id);
    }
    process.exit(0);
};
run();
