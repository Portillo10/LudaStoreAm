"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setProducts = exports.refreshStoreToken = exports.getStoreByAlias = void 0;
const database_1 = require("../database");
const getCollection = () => {
    const db = (0, database_1.getDatabase)();
    const collection = db.collection("stores");
    return collection;
};
const getStoreByAlias = async (alias) => {
    const collection = getCollection();
    const result = await collection.findOne({ alias });
    return result;
};
exports.getStoreByAlias = getStoreByAlias;
const refreshStoreToken = async (alias, refreshToken) => {
    const collection = getCollection();
    const result = await collection.updateOne({ alias }, { $set: { refresh_token: refreshToken } });
    return result.modifiedCount > 0;
};
exports.refreshStoreToken = refreshStoreToken;
const setProducts = async (skuList, id) => {
    const collection = getCollection();
    const result = await collection.updateOne({ _id: id }, { $set: { products: skuList } });
    return result.modifiedCount > 0;
};
exports.setProducts = setProducts;
