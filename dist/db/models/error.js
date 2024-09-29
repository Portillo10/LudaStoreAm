"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getError = exports.getErrors = exports.insertError = void 0;
const database_1 = require("../database");
const insertError = async (error) => {
    const db = (0, database_1.getDatabase)();
    const result = await db.collection("errors").insertOne(error);
};
exports.insertError = insertError;
const getErrors = async () => {
    const db = (0, database_1.getDatabase)();
    const result = await db.collection("errors").find().toArray();
    return result;
};
exports.getErrors = getErrors;
const getError = async (filter) => {
    const db = (0, database_1.getDatabase)();
    const result = await db.collection("errors").findOne(filter);
    return result;
};
exports.getError = getError;
