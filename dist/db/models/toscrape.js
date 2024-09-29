"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteScrape = exports.getToScrape = void 0;
const database_1 = require("../database");
const getCollection = () => {
    const db = (0, database_1.getDatabase)();
    return db.collection("toscrape");
};
const getToScrape = async (filter) => {
    const collection = getCollection();
    const result = await collection.find(filter).toArray();
    return result;
};
exports.getToScrape = getToScrape;
const deleteScrape = async (filter, deleteOptions) => {
    const collection = getCollection();
    const result = await collection.deleteMany(filter, deleteOptions);
    return result;
};
exports.deleteScrape = deleteScrape;
