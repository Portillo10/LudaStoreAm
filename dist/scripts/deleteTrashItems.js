"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const database_1 = require("../db/database");
const store_1 = require("../db/models/store");
const product_1 = require("../db/models/product");
const mlItems_1 = require("../services/mlItems");
const auth_1 = require("../services/auth");
const jsonHelper_1 = require("../utils/jsonHelper");
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
(async () => {
    await (0, database_1.connectToDatabase)();
    const store = await (0, store_1.getStoreByAlias)("LudaStore");
    if (!store)
        throw new Error("No se encontró la tienda");
    let token = await (0, auth_1.refreshAccessToken)(store.alias);
    // const products = await getByCategorie(categories)
    // console.log(products.length);
    // const itemIdList = await readJSON("data/ml_ids.json")
    const itemIdList = await (0, mlItems_1.getAllItemIds)(token, store.user_id);
    console.log(itemIdList.length);
    await (0, jsonHelper_1.saveData)(itemIdList, "data/ml_ids.json");
    // await input("continue")
    for (const item_id of itemIdList) {
        const product = await (0, product_1.getProductByItemId)(item_id);
        if (!product) {
            console.log(item_id);
            await (0, mlItems_1.deleteItemById)(item_id, token);
        }
    }
    process.exit(0);
})();
