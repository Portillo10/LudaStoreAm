"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeDuplicates = exports.deleteItemByItemId = exports.getItemBySku = exports.itemExistBySku = exports.getAllItems = exports.createItem = void 0;
const database_1 = require("../database");
const inputHelper_1 = require("../../utils/inputHelper");
const createItem = async (item) => {
    const db = (0, database_1.getDatabase)();
    const result = await db.collection("mlitems").insertOne(item);
    return result.insertedId ? true : false;
};
exports.createItem = createItem;
const getAllItems = async () => {
    const db = (0, database_1.getDatabase)();
    const items = await db.collection("mlitems").find().toArray();
    return items;
};
exports.getAllItems = getAllItems;
const itemExistBySku = async (sku) => {
    const db = (0, database_1.getDatabase)();
    const item = await db.collection("items").findOne({ sku });
    return item ? true : false;
};
exports.itemExistBySku = itemExistBySku;
const getItemBySku = async (sku) => {
    const db = (0, database_1.getDatabase)();
    const item = await db.collection("items").findOne({ sku });
    return item;
};
exports.getItemBySku = getItemBySku;
const deleteItemByItemId = async (item_id) => {
    const db = (0, database_1.getDatabase)();
    const item = await db.collection("mlitems").deleteOne({ item_id });
    return item.deletedCount > 0;
};
exports.deleteItemByItemId = deleteItemByItemId;
const removeDuplicates = async () => {
    try {
        const db = (0, database_1.getDatabase)();
        const collection = db.collection("mlitems");
        // Identificar duplicados
        const pipeline = [
            {
                $group: {
                    _id: {
                        field1: "item_id", // Cambia esto a los campos que definen un duplicado
                        // field2: "$field2", // Añade más campos si es necesario
                    },
                    count: { $sum: 1 },
                    ids: { $push: "$_id" },
                },
            },
            {
                $match: {
                    count: { $gt: 1 },
                },
            },
        ];
        const duplicates = await collection.aggregate(pipeline).toArray();
        console.log("Found duplicates:", duplicates.length);
        await (0, inputHelper_1.input)("press any key.");
        // Eliminar duplicados
        for (const doc of duplicates) {
            const [, ...idsToRemove] = doc.ids;
            await collection.deleteMany({
                _id: { $in: idsToRemove },
            });
        }
        console.log("Duplicates removed");
    }
    catch (error) {
        console.error("Error removing duplicates:", error);
    }
    finally {
    }
};
exports.removeDuplicates = removeDuplicates;
