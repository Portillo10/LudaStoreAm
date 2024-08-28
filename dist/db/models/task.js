"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertSku = exports.updateCurrentUrl = exports.addLinks = exports.deleteTask = exports.deleteLink = exports.getTask = exports.createTask = void 0;
const database_1 = require("../database");
const getCollection = () => {
    const db = (0, database_1.getDatabase)();
    const collection = db.collection("tasks");
    return collection;
};
const createTask = async (task) => {
    const collection = getCollection();
    const result = await collection.insertOne(task);
    return result.insertedId;
};
exports.createTask = createTask;
const getTask = async () => {
    const collection = getCollection();
    const result = await collection.find().toArray();
    return result.length > 0 ? result[0] : null;
};
exports.getTask = getTask;
const deleteLink = async (link) => {
    const collection = getCollection();
    const id = (await collection.find().toArray())[0]?._id;
    const result = await collection.updateOne({ _id: id }, { $pull: { linkList: link } });
    return result.modifiedCount > 0;
};
exports.deleteLink = deleteLink;
const deleteTask = async () => {
    const collection = getCollection();
    const result = await collection.deleteMany({});
    return result.deletedCount > 0;
};
exports.deleteTask = deleteTask;
const addLinks = async (links) => {
    const collection = getCollection();
    const id = (await collection.find().toArray())[0]?._id;
    const result = await collection.updateOne({ _id: id }, {
        $set: {
            linkList: links,
        },
    });
    return result.modifiedCount;
};
exports.addLinks = addLinks;
const updateCurrentUrl = async (url) => {
    const collection = getCollection();
    const id = (await collection.find().toArray())[0]?._id;
    const result = await collection.updateOne({ _id: id }, { $set: { currentUrl: url } });
    return result.modifiedCount > 0;
};
exports.updateCurrentUrl = updateCurrentUrl;
const insertSku = async (sku) => {
    const collection = getCollection();
    const id = (await collection.find().toArray())[0]?._id;
    const result = await collection.updateOne({ _id: id }, { $push: { skuList: sku } });
    return result.modifiedCount > 0;
};
exports.insertSku = insertSku;
