"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postedLinkExist = exports.insertPostedLink = void 0;
const database_1 = require("../database");
const insertPostedLink = async (link) => {
    const db = (0, database_1.getDatabase)();
    const result = await db.collection("postedlinks").insertOne(link);
    return result.insertedId;
};
exports.insertPostedLink = insertPostedLink;
const postedLinkExist = async (link) => {
    const db = (0, database_1.getDatabase)();
    const result = await db.collection("postedlinks").findOne({ link });
    return !!result;
};
exports.postedLinkExist = postedLinkExist;
