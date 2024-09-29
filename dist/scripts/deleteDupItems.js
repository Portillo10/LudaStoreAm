"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const database_1 = require("../db/database");
const auth_1 = require("../services/auth");
const mlItems_1 = require("../services/mlItems");
const product_1 = require("../db/models/product");
const inputHelper_1 = require("../utils/inputHelper");
const helpers_1 = require("../utils/helpers");
const store_1 = require("../db/models/store");
(async () => {
    await (0, database_1.connectToDatabase)();
    const products = await (0, product_1.getGroupedRecordsBySku)();
    console.log(products.length);
    await (0, inputHelper_1.input)("enter");
    const store = await (0, store_1.getStoreByAlias)("PortilloStore");
    let token = await (0, auth_1.refreshAccessToken)("PortilloStore");
    if (!token)
        throw new Error("Error access_token");
    //   await input("Press any");
    for (const chunk of products) {
        const item_ids = chunk.map((item) => ({
            ml_id: item.item_id,
            sku: item.sku,
            id: item._id,
        }));
        const storeProducts = store.skuList
            .map((item) => item.sku)
            .filter((sku) => sku !== null);
        if (storeProducts.includes(item_ids[0].sku)) {
            console.log("Producto no se encontró en la tienda");
            continue;
        }
        console.log(item_ids);
        const idList = item_ids.map((item) => item.ml_id);
        // await input("press enter");
        if (idList.length > 1) {
            await (0, helpers_1.sleep)(300);
            const items = await (0, mlItems_1.getItemsByItemId)(idList, token);
            if (items.length < 2) {
                console.log("No se encontraron los items");
                console.log(idList);
                await (0, inputHelper_1.input)("continue");
                await (0, product_1.setError)(item_ids[0].sku);
                await (0, product_1.deleteProductById)(item_ids[1].id);
                continue;
            }
            let inactive = false;
            let sku;
            for (const item of items) {
                const { status, id, attributes } = item;
                const { value_name } = attributes?.find((attribute) => attribute.id == "SELLER_SKU") || { value_name: "" };
                sku = value_name;
                if (status != "active") {
                    inactive = true;
                    console.log(item_ids);
                    console.log(status, id);
                    // await input("continue");
                    try {
                        (0, helpers_1.sleep)(600);
                        await (0, mlItems_1.deleteItemById)(item.id, token);
                        const deleted = await (0, product_1.deleteByItemId)(item.id);
                        if (!deleted) {
                            await (0, inputHelper_1.input)("No se eliminó");
                        }
                        else {
                            console.log("eliminado correctamente");
                        }
                    }
                    catch (error) {
                        console.log("Ocurrió un problema eliminando el producto", sku);
                    }
                }
                else if (idList[0] === idList[1]) {
                    console.log(idList);
                    await (0, inputHelper_1.input)("quieto");
                    // const product = await getByItemId(id)
                }
            }
            if (!inactive) {
                console.log("inactive");
                const productList = await (0, product_1.getProductsBySku)(sku);
                const trashProduct = productList.find((product) => product.state == "active");
                if (!trashProduct?.item_id)
                    continue;
                try {
                    (0, helpers_1.sleep)(600);
                    await (0, mlItems_1.deleteItemById)(trashProduct.item_id, token);
                    const deleted = await (0, product_1.deleteByItemId)(trashProduct.item_id);
                    if (!deleted) {
                        await (0, inputHelper_1.input)("No se eliminó");
                    }
                    else {
                        console.log("eliminado correctamente");
                    }
                }
                catch (error) {
                    console.log("Ocurrió un problema eliminando el producto", sku);
                }
            }
        }
        else if (idList.length == 0 && item_ids.length > 1) {
            const [id, ...rest] = item_ids;
            const listId = rest.map((item) => item.id);
            console.log(listId);
            const deletedCount = await (0, product_1.deleteByIds)(listId);
            console.log(deletedCount);
        }
        // await input("Press any to continue");
    }
})();
