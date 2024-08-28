"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectToDatabase = connectToDatabase;
exports.getDatabase = getDatabase;
const mongodb_1 = require("mongodb");
const uri = process.env.MONGODB_CNN || '';
let db;
async function connectToDatabase() {
    if (!db) {
        const client = new mongodb_1.MongoClient(uri);
        await client.connect();
        db = client.db("ludastore");
        console.log("Connected to database");
    }
    return db;
}
function getDatabase() {
    if (!db) {
        throw new Error("Database not connected. Call connectToDatabase first.");
    }
    return db;
}
