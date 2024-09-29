"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProductByItemId = exports.setDescription = exports.getPendingProducts = exports.getProductsBySku = exports.getProductsBySkuList = exports.getProducts = exports.deleteProductById = exports.setPrice = exports.deleteItemId = exports.updateItemCondition = exports.setError = exports.getRefurbishedByCategories = exports.getByCategorie = exports.getByCategoriesAndState = exports.getByCategories = exports.updateProduct = exports.getBadWeight = exports.deleteByIds = exports.deleteByItemId = exports.getByItemId = exports.updateState = exports.getActiveProducts = exports.activateProduct = exports.getErrorProducts = exports.getProductBySku = exports.getProduct = exports.createProduct = exports.getCollection = void 0;
exports.getGroupedRecordsBySku = getGroupedRecordsBySku;
const database_1 = require("../database");
const store_1 = require("./store");
const getCollection = () => {
    const db = (0, database_1.getDatabase)();
    const collection = db.collection("products");
    return collection;
};
exports.getCollection = getCollection;
const createProduct = async (product
// storeId: ObjectId
) => {
    const collection = (0, exports.getCollection)();
    const productExist = await (0, exports.getProductBySku)(product.sku || "");
    if (productExist)
        return null;
    const result = await collection.insertOne(product);
    // if (result) {
    //   const added = await addProduct(storeId, {
    //     sku: product.sku,
    //     item_id: product.item_id,
    //   });
    //   return result && added;
    // }
    return false;
};
exports.createProduct = createProduct;
const getProduct = async (filter, findOptions) => {
    const db = (0, database_1.getDatabase)();
    const item = await db
        .collection("products")
        .findOne(filter, findOptions);
    return item;
};
exports.getProduct = getProduct;
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
const activateProduct = async (sku, item_id, storeId) => {
    const db = (0, database_1.getDatabase)();
    const result = await db
        .collection("products")
        .updateOne({ sku }, { $set: { state: "active", item_id } });
    await (0, store_1.addProduct)(storeId, { sku, item_id });
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
const deleteByIds = async (ids) => {
    const db = (0, database_1.getDatabase)();
    const collection = db.collection("products");
    const result = await collection.deleteMany({ _id: { $in: ids } });
    return result.deletedCount;
};
exports.deleteByIds = deleteByIds;
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
        throw error;
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
const updateProduct = async (filter, update) => {
    const collection = (0, exports.getCollection)();
    const result = await collection.updateOne(filter, update);
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
const getByCategoriesAndState = async (categories, state) => {
    const db = (0, database_1.getDatabase)();
    const collection = db.collection("products");
    const result = await collection
        .find({
        category_id: { $in: categories },
        item_id: { $ne: null },
        state,
    })
        .toArray();
    return result;
};
exports.getByCategoriesAndState = getByCategoriesAndState;
const getByCategorie = async (categories) => {
    const db = (0, database_1.getDatabase)();
    const collection = db.collection("products");
    const result = await collection
        .find({
        category_id: { $in: categories },
        state: { $nin: ["pending", "omited"] },
    }, { projection: { pictures: 0, attributes: 0, description: 0 } })
        .toArray();
    return result;
};
exports.getByCategorie = getByCategorie;
const getRefurbishedByCategories = async (categories) => {
    const db = (0, database_1.getDatabase)();
    const collection = db.collection("products");
    const result = await collection
        .find({
        category_id: { $in: categories },
        item_id: { $ne: null },
        condition: "refurbished",
    })
        .toArray();
    return result;
};
exports.getRefurbishedByCategories = getRefurbishedByCategories;
const setError = async (sku) => {
    const db = (0, database_1.getDatabase)();
    const collection = db.collection("products");
    const result = await collection.updateOne({ sku }, { $set: { state: "error", item_id: null } });
    return result.modifiedCount > 0;
};
exports.setError = setError;
const updateItemCondition = async (condition, _id) => {
    const collection = (0, exports.getCollection)();
    const result = await collection.updateOne({ _id }, { $set: { condition } });
    return result.modifiedCount > 0;
};
exports.updateItemCondition = updateItemCondition;
const deleteItemId = async (_id) => {
    const collection = (0, exports.getCollection)();
    const result = await collection.updateOne({ _id }, { $set: { state: "deleted" } });
    return result.matchedCount > 0;
};
exports.deleteItemId = deleteItemId;
const setPrice = async (_id, price) => {
    const collection = (0, exports.getCollection)();
    const result = await collection.updateOne({ _id }, { $set: { price } });
    return result.modifiedCount > 0;
};
exports.setPrice = setPrice;
const deleteProductById = async (_id) => {
    const collection = (0, exports.getCollection)();
    const result = await collection.deleteOne({ _id });
    return result.deletedCount > 0;
};
exports.deleteProductById = deleteProductById;
const getProducts = async (filters, projection) => {
    const collection = (0, exports.getCollection)();
    const result = await collection
        .find(filters, {
        projection,
    })
        .toArray();
    return result;
};
exports.getProducts = getProducts;
const getProductsBySkuList = async (skuList) => {
    const result = await (0, exports.getProducts)({ sku: { $in: skuList } }, {
        pictures: 0,
        description: 0,
        attributes: 0,
    });
    return result;
};
exports.getProductsBySkuList = getProductsBySkuList;
const getProductsBySku = async (sku) => {
    const collection = (0, exports.getCollection)();
    const result = await collection.find({ sku }).toArray();
    return result;
};
exports.getProductsBySku = getProductsBySku;
const getPendingProducts = async () => {
    const collection = (0, exports.getCollection)();
    const result = await collection
        .find({ state: "pending", condition: { $ne: "refurbished" } })
        .toArray();
    return result;
};
exports.getPendingProducts = getPendingProducts;
const setDescription = async (_id, description) => {
    const collection = (0, exports.getCollection)();
    const result = await collection.updateOne({ _id }, { $set: { description } });
    return result.modifiedCount > 0;
};
exports.setDescription = setDescription;
const getProductByItemId = async (item_id) => {
    const collection = (0, exports.getCollection)();
    const result = await collection.findOne({ item_id }, {
        projection: {
            _id: 0,
            pictures: 0,
            attributes: 0,
            description: 0,
            title: 0,
            price: 0,
            sku: 0,
            weight: 0,
        },
    });
    return result;
};
exports.getProductByItemId = getProductByItemId;
