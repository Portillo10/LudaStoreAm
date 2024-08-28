"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const database_1 = require("../db/database");
const auth_1 = require("../services/auth");
const mlItems_1 = require("../services/mlItems");
const product_1 = require("../db/models/product");
const inputHelper_1 = require("../utils/inputHelper");
(async () => {
    await (0, database_1.connectToDatabase)();
    let token = await (0, auth_1.refreshAccessToken)();
    if (!token)
        throw new Error("Error access_token");
    const products = await (0, product_1.getGroupedRecordsBySku)();
    console.log(products.length);
    //   await input("Press any");
    for (const chunk of products) {
        const item_ids = chunk.map((item) => ({
            id: item.item_id,
            sku: item.sku,
            ml_id: item._id,
        }));
        console.log(item_ids);
        const idList = item_ids
            .filter((item) => item.id != null)
            .map((item) => item.id);
        if (idList.length > 1) {
            const items = await (0, mlItems_1.getItemsByItemId)(idList, token);
            if (!items)
                continue;
            for (const item of items) {
                const { status, id } = item;
                if (status != "active" && idList[0] !== idList[1]) {
                    console.log(item_ids);
                    console.log(status, id);
                    await (0, mlItems_1.deleteItemById)(item.id, token);
                    await (0, inputHelper_1.input)("continue");
                    const deleted = await (0, product_1.deleteByItemId)(item.id);
                    if (!deleted) {
                        await (0, inputHelper_1.input)("No se eliminó");
                    }
                }
                else {
                    // const product = await getByItemId(id)
                }
            }
        }
        else if (idList.length == 0 && item_ids.length > 1) {
            const [id, ...rest] = item_ids;
            const listId = rest.map(item => item.ml_id);
            console.log(listId);
            const deletedCount = await (0, product_1.deleteById)(listId);
            console.log(deletedCount);
        }
        await (0, inputHelper_1.input)("Press any to continue");
    }
})();
