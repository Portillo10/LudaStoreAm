"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllSkus = exports.countProducts = exports.updatePostedLink = exports.updateLink = exports.getPostedLinks = exports.postedLinkExist = exports.insertPostedLink = void 0;
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
const getPostedLinks = async (filter) => {
    const db = (0, database_1.getDatabase)();
    const result = await db
        .collection("postedlinks")
        .find(filter)
        .toArray();
    return result;
};
exports.getPostedLinks = getPostedLinks;
const updateLink = async (_id, update) => {
    const db = (0, database_1.getDatabase)();
    const result = await db
        .collection("postedlinks")
        .updateOne({ _id }, update);
    return result;
};
exports.updateLink = updateLink;
const updatePostedLink = async (filter, update) => {
    const db = (0, database_1.getDatabase)();
    const result = await db
        .collection("postedlinks")
        .updateMany(filter, update);
    return result.modifiedCount > 0;
};
exports.updatePostedLink = updatePostedLink;
const countProducts = async () => {
    const db = (0, database_1.getDatabase)();
    const collection = db.collection("postedlinks");
    const result = await collection
        .aggregate([
        { $unwind: "$skuList" }, // Descompone el array de productos
        { $count: "totalProducts" }, // Cuenta el número de documentos resultantes
    ])
        .toArray();
    // Verificamos si hay resultados y mostramos el conteo
    if (result.length > 0) {
        console.log("Total de productos:", result[0].totalProducts);
    }
    else {
        console.log("No hay productos en la colección.");
    }
};
exports.countProducts = countProducts;
const getAllSkus = async () => {
    const db = (0, database_1.getDatabase)();
    const collection = db.collection("postedlinks");
    const result = await collection
        .aggregate([
        { $unwind: "$skuList" },
        { $project: { sku: "$skuList" } }
    ])
        .toArray();
    return result;
};
exports.getAllSkus = getAllSkus;
