import { Filter, ObjectId, UpdateFilter } from "mongodb";
import { getDatabase } from "../database";

export interface link {
  _id?: ObjectId;
  link: string | null;
  category_id: string | null;
  updated: boolean;
  skuList: string[];
  lastUpdate: Date;
}

export const insertPostedLink = async (link: link) => {
  const db = getDatabase();
  const result = await db.collection("postedlinks").insertOne(link);
  return result.insertedId;
};

export const postedLinkExist = async (link: string) => {
  const db = getDatabase();
  const result = await db.collection<link>("postedlinks").findOne({ link });
  return !!result;
};

export const getPostedLinks = async (filter: Filter<link>) => {
  const db = getDatabase();
  const result = await db
    .collection<link>("postedlinks")
    .find(filter)
    .toArray();
  return result;
};

export const updateLink = async (_id: ObjectId, update: UpdateFilter<link>) => {
  const db = getDatabase();
  const result = await db
    .collection<link>("postedlinks")
    .updateOne({ _id }, update);
  return result;
};

export const updatePostedLink = async (
  filter: Filter<link>,
  update: UpdateFilter<link>
) => {
  const db = getDatabase();
  const result = await db
    .collection<link>("postedlinks")
    .updateMany(filter, update);
  return result.modifiedCount > 0;
};

export const countProducts = async () => {
  const db = getDatabase();

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
  } else {
    console.log("No hay productos en la colección.");
  }
};

export const getAllSkus = async () => {
  const db = getDatabase();
  const collection = db.collection<link>("postedlinks");
  const result = await collection
    .aggregate([
      { $unwind: "$skuList" },
      { $project: { sku: "$skuList" } }
    ])
    .toArray();

  return result;
};
