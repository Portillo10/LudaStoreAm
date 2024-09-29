"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const database_1 = require("../db/database");
const store_1 = require("../db/models/store");
const auth_1 = require("../services/auth");
const jsonHelper_1 = require("../utils/jsonHelper");
const taskExecutor_1 = require("../utils/taskExecutor");
const mlItems_1 = require("../services/mlItems");
const inputHelper_1 = require("../utils/inputHelper");
const productStore_1 = require("../db/models/productStore");
const product_1 = require("../db/models/product");
const axios_1 = require("axios");
const saveEmpty = async (item_ids, store_id, token) => {
    for (const item_id of item_ids) {
        const productStore = await (0, productStore_1.getProducStore)({ item_id });
        if (productStore) {
            // console.log("ID duplicado");
        }
        else {
            console.log(item_id);
            const item = await (0, mlItems_1.getItemsByItemId)([item_id], token);
            const { attributes } = item[0];
            let sku = "";
            if (attributes) {
                const { value_name } = attributes.find((attribute) => attribute.id == "SELLER_SKU") || { value_name: "" };
                sku = value_name;
                const skuExist = await (0, productStore_1.getProducStore)({ productSku: sku });
                if (skuExist) {
                    console.log(`${sku} duplicado`);
                }
                else if (sku) {
                    await (0, inputHelper_1.input)(`${sku} se guardará`);
                    await (0, productStore_1.insertProductStore)({ item_id, store_id, productSku: sku, state: "" });
                }
                else {
                    console.log(sku);
                }
            }
        }
    }
};
(async () => {
    await (0, database_1.connectToDatabase)();
    const store = await (0, store_1.getStoreByAlias)("PortilloStore");
    if (!store)
        throw new Error("");
    let token = await (0, auth_1.refreshAccessToken)(store.alias);
    //   const itemIds = await readJSON("data/protilloActiveProducts.json");
    const itemIds = await (0, mlItems_1.getAllItemIds)(token, store.user_id);
    await (0, jsonHelper_1.writeJSON)("data/portilloActiveProducts.json", itemIds);
    //   await input("ready")
    const chunks = (0, taskExecutor_1.chunkArray)(itemIds, 20);
    let count = 0;
    for (const chunk of chunks) {
        console.log(`${count} productos guardados`);
        if (count < 30000) {
            count += 20;
            continue;
        }
        // await saveEmpty(chunk, store._id, token);
        try {
            const items = await (0, mlItems_1.getItemsByItemId)(chunk, token);
            for (const item of items) {
                const productStore = await (0, productStore_1.getProducStore)({ item_id: item.id });
                if (productStore)
                    continue;
                const { attributes } = item;
                let sku = "";
                if (attributes) {
                    const { value_name } = attributes.find((attribute) => attribute.id == "SELLER_SKU") || { value_name: "" };
                    sku = value_name;
                    const productStore = await (0, productStore_1.getProducStore)({ productSku: sku });
                    if (productStore.length > 0) {
                        console.log(sku);
                        console.log("producto duplicado");
                        // await input("enter para borrarlo");
                        // await pausePub(item.id, token);
                        continue;
                    }
                    const product = await (0, product_1.getProduct)({ sku }, {
                        projection: { pictures: 0, attributes: 0, description: 0 },
                    });
                    if (!product) {
                        await (0, mlItems_1.pausePub)(item.id, token);
                        continue;
                    }
                    await (0, productStore_1.insertProductStore)({
                        item_id: item.id,
                        productSku: sku,
                        store_id: store._id,
                        state: ""
                    });
                }
                else {
                    console.log(`no se encontró el sku para ${item.id}`);
                    await (0, inputHelper_1.input)("presione enter para continuar");
                }
                count++;
            }
        }
        catch (error) {
            if ((0, axios_1.isAxiosError)(error)) {
                console.log(error.response?.data);
            }
            else {
                console.log(error);
            }
        }
    }
    //   const skuList = await getAllSkus();
    //   const uniqueList = skuList.reduce((acc, curr) => {
    //     if (!acc.includes(curr)) {
    //       acc.push(curr.sku);
    //     }
    //     return acc;
    //   }, []);
    //   console.log(uniqueList.length);
    process.exit(0);
})();
