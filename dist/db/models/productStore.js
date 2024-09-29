"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOneProducStore = exports.getProducStore = exports.insertProductStore = void 0;
const database_1 = require("../database");
const getCollection = () => {
    const db = (0, database_1.getDatabase)();
    const collection = db.collection("productstore");
    return collection;
};
const insertProductStore = async (doc) => {
    const collection = getCollection();
    const result = await collection.insertOne(doc);
    return result.insertedId;
};
exports.insertProductStore = insertProductStore;
const getProducStore = async (filter) => {
    const collection = getCollection();
    const result = await collection.find(filter).toArray();
    return result;
};
exports.getProducStore = getProducStore;
const getOneProducStore = async (filter) => {
    const collection = getCollection();
    const result = await collection.findOne(filter);
    return result;
};
exports.getOneProducStore = getOneProducStore;
