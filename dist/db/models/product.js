"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setError = exports.getByCategories = exports.updateProduct = exports.getBadWeight = exports.deleteById = exports.deleteByItemId = exports.getByItemId = exports.updateState = exports.getActiveProducts = exports.activateProduct = exports.getErrorProducts = exports.getProductBySku = exports.createProduct = void 0;
exports.getGroupedRecordsBySku = getGroupedRecordsBySku;
const database_1 = require("../database");
const createProduct = async (product) => {
    const db = (0, database_1.getDatabase)();
    const productExist = await (0, exports.getProductBySku)(product.sku || "");
    if (productExist)
        return null;
    const result = await db.collection("products").insertOne(product);
    return result.insertedId;
};
exports.createProduct = createProduct;
const getProductBySku = async (sku) => {
    const db = (0, database_1.getDatabase)();
    const item = await db.collection("products").findOne({ sku });
    return item;
};
exports.getProductBySku = getProductBySku;
const getErrorProducts = async () => {
    const db = (0, database_1.getDatabase)();
    const items = await db
        .collection("products")
        .find({ state: "error" })
        .toArray();
    return items;
};
exports.getErrorProducts = getErrorProducts;
const activateProduct = async (sku, item_id) => {
    const db = (0, database_1.getDatabase)();
    const result = await db
        .collection("products")
        .updateOne({ sku }, { $set: { state: "active", item_id } });
    return result.modifiedCount > 0;
};
exports.activateProduct = activateProduct;
const getActiveProducts = async () => {
    const db = (0, database_1.getDatabase)();
    const result = await db
        .collection("products")
        .find({ state: "active" })
        .toArray();
    return result;
};
exports.getActiveProducts = getActiveProducts;
const updateState = async (sku, state) => {
    const db = (0, database_1.getDatabase)();
    const result = await db
        .collection("products")
        .updateOne({ sku }, { $set: { state } });
    return result.modifiedCount > 0;
};
exports.updateState = updateState;
const getByItemId = async (item_id) => {
    const db = (0, database_1.getDatabase)();
    const item = await db
        .collection("products")
        .findOne({ item_id });
    return item;
};
exports.getByItemId = getByItemId;
const deleteByItemId = async (item_id) => {
    const db = (0, database_1.getDatabase)();
    const collection = db.collection("products");
    const result = await collection.deleteOne({ item_id });
    return result.deletedCount > 0;
};
exports.deleteByItemId = deleteByItemId;
const deleteById = async (ids) => {
    const db = (0, database_1.getDatabase)();
    const collection = db.collection("products");
    const result = await collection.deleteMany({ _id: { $in: ids } });
    return result.deletedCount;
};
exports.deleteById = deleteById;
async function getGroupedRecordsBySku() {
    try {
        const db = (0, database_1.getDatabase)();
        const collection = db.collection("products");
        const pipeline = [
            {
                $group: {
                    _id: "$sku",
                    records: { $push: "$$ROOT" },
                    count: { $sum: 1 },
                },
            },
            {
                $match: {
                    count: { $gt: 1 },
                },
            },
        ];
        const result = await collection.aggregate(pipeline).toArray();
        const groupedRecords = result.map((group) => group.records);
        return groupedRecords;
    }
    catch (error) {
        console.error("Error fetching grouped records:", error);
        throw error; // Propaga el error para que pueda ser manejado por el llamador
    }
}
const getBadWeight = async (category) => {
    const db = (0, database_1.getDatabase)();
    const collection = db.collection("products");
    const result = await collection
        .find({ category_id: category, weight: "1 lb" })
        .toArray();
    return result;
};
exports.getBadWeight = getBadWeight;
const updateProduct = async (data, id) => {
    const db = (0, database_1.getDatabase)();
    const collection = db.collection("products");
    const result = await collection.updateOne({ _id: id }, {
        $set: {
            ...data,
        },
    });
    return result.modifiedCount > 0;
};
exports.updateProduct = updateProduct;
const getByCategories = async (categories) => {
    const db = (0, database_1.getDatabase)();
    const collection = db.collection("products");
    const result = await collection
        .find({ category_id: { $in: categories }, item_id: { $ne: null } })
        .toArray();
    return result;
};
exports.getByCategories = getByCategories;
const setError = async (sku) => {
    const db = (0, database_1.getDatabase)();
    const collection = db.collection("products");
    const result = await collection.updateOne({ sku }, { $set: { state: "error", item_id: null } });
    return result.modifiedCount > 0;
};
exports.setError = setError;
