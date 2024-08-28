"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const database_1 = require("../db/database");
const auth_1 = require("../services/auth");
const mlItems_1 = require("../services/mlItems");
const taskExecutor_1 = require("../utils/taskExecutor");
const product_1 = require("../db/models/product");
const inputHelper_1 = require("../utils/inputHelper");
const helpers_1 = require("../utils/helpers");
(async () => {
    await (0, database_1.connectToDatabase)();
    let token = await (0, auth_1.refreshAccessToken)("PortilloStore");
    console.log(`token: ${token}`);
    let scrollId = "eyJpZCI6Ik1DTzI2MjcyNzQxMDgiLCJudW1lcmljX2lkIjoyNjI3Mjc0MTA4LCJzdG9wX3RpbWUiOiIyMDQ0LTA4LTE3VDA0OjAwOjAwLjAwMFoifQ==";
    let currentResults = [];
    let total = 0;
    try {
        while (currentResults) {
            const { results, scroll_id } = await (0, mlItems_1.getItemsByScrollId)(scrollId, token);
            if (scroll_id) {
                currentResults = results;
                scrollId = scroll_id;
                console.log(scroll_id);
            }
            else {
                currentResults = null;
                await (0, inputHelper_1.input)("press any key, scroll null");
                break;
            }
            // console.log(results);
            if (results) {
                const resultArray = (0, taskExecutor_1.chunkArray)(results, 20);
                for (const result of resultArray) {
                    const items = (await (0, mlItems_1.getItemsByItemId)(result, token)) || [];
                    // console.log(items);
                    for (const item of items) {
                        total++;
                        if (item.id == "MCO2613617958")
                            continue;
                        const { id, attributes } = item;
                        let sku = "";
                        if (attributes) {
                            const { value_name } = attributes.find((attribute) => attribute.id == "SELLER_SKU") || { value_name: "" };
                            sku = value_name;
                        }
                        // console.log(`sku: ${sku}`);
                        const product = await (0, product_1.getByItemId)(id);
                        if (item.status !== "active") {
                            console.log(product?.sku, "-", item.id, item.status);
                            try {
                                await (0, mlItems_1.deleteItemById)(id, token);
                            }
                            catch (error) { }
                            await (0, product_1.setError)(product?.sku || "");
                            console.log("");
                            await (0, helpers_1.sleep)(500);
                        }
                        else if (!product) {
                            console.log(item.id);
                            try {
                                await (0, mlItems_1.deleteItemById)(id, token);
                            }
                            catch (error) { }
                            console.log("");
                            await (0, helpers_1.sleep)(500);
                        }
                        // if (!product) {
                        //   const amProduct = await getProductBySku(sku);
                        //   if (!amProduct) {
                        //     const created = await createItem({
                        //       item_id: id,
                        //       sku,
                        //       attributes,
                        //       data: item,
                        //     });
                        //     if (created) {
                        //       // console.log("guardado con éxito");
                        //     } else {
                        //       console.log("No se guardó el item");
                        //       await saveData(
                        //         { sku, id, attributes, item },
                        //         "data/black_skus.json"
                        //       );
                        //     }
                        //   }
                        // }
                    }
                    await (0, helpers_1.sleep)(500);
                }
                await (0, helpers_1.sleep)(500);
            }
        }
    }
    catch (error) {
        console.log(error);
    }
    finally {
        console.log(`Productos: ${total}`);
    }
})();
