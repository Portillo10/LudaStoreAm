import { ObjectId } from "mongodb";
import { getDatabase } from "../database";
import { Attributes } from "../../types";
import { Product } from "../../models/Product";

export interface ProductItem {
  _id?: ObjectId;
  sku: string | null;
  price: number | null;
  weight: string | null | number;
  dimensions: string | null | number;
  title: string | null;
  category_id: string | null;
  item_id: string | null;
  description: string;
  pictures: {
    source: string;
  }[];
  attributes: Attributes;
  state: string;
}

export const createProduct = async (product: ProductItem) => {
  const db = getDatabase();
  const result = await db.collection("products").insertOne(product);
  return result.insertedId;
};

export const getProductBySku = async (sku: string) => {
  const db = getDatabase();
  const item = await db.collection<ProductItem>("products").findOne({ sku });
  return item;
};

export const getErrorProducts = async () => {
  const db = getDatabase();
  const items = await db
    .collection<ProductItem>("products")
    .find({ state: "error" })
    .toArray();
  return items;
};

export const activateProduct = async (sku: string, item_id: string) => {
  const db = getDatabase();
  const result = await db
    .collection<ProductItem>("products")
    .updateOne({ sku }, { $set: { state: "active", item_id } });
  return result.modifiedCount > 0;
};

export const getActiveProducts = async () => {
  const db = getDatabase();
  const result = await db
    .collection<ProductItem>("products")
    .find({ state: "active" })
    .toArray();

  return result;
};

export const updateState = async (sku: string, state: string) => {
  const db = getDatabase();
  const result = await db
    .collection<ProductItem>("products")
    .updateOne({ sku }, { $set: { state } });
  return result.modifiedCount > 0;
};

export const getByItemId = async (item_id: string) => {
  const db = getDatabase();
  const item = await db
    .collection<ProductItem>("products")
    .findOne({ item_id });
  return item;
};

export const deleteByItemId = async (item_id: string) => {
  const db = getDatabase();
  const collection = db.collection<ProductItem>("products");
  const result = await collection.deleteOne({ item_id });
  return result.deletedCount > 0;
};

export const deleteById = async (ids: ObjectId[]) => {
  const db = getDatabase();
  const collection = db.collection<ProductItem>("products");
  const result = await collection.deleteMany({ _id: { $in: ids } });
  return result.deletedCount
};

export async function getGroupedRecordsBySku(): Promise<any[][]> {
  try {
    const db = getDatabase();
    const collection = db.collection<ProductItem>("products");

    const pipeline = [
      {
        $group: {
          _id: "$sku",
          records: { $push: "$$ROOT" },
          count: { $sum: 1 },
        },
      },
      {
        $match: {
          count: { $gt: 1 },
        },
      },
    ];

    const result = await collection.aggregate(pipeline).toArray();

    const groupedRecords = result.map((group) => group.records);

    return groupedRecords;
  } catch (error) {
    console.error("Error fetching grouped records:", error);
    throw error; // Propaga el error para que pueda ser manejado por el llamador
  }
}
