"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertError = void 0;
const database_1 = require("../database");
const insertError = async (error) => {
    const db = (0, database_1.getDatabase)();
    const result = db.collection("errors").insertOne(error);
};
exports.insertError = insertError;
