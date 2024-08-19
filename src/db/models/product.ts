import { ObjectId } from "mongodb";
import { getDatabase } from "../database";
import { Attributes } from "../../types";

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
  const db = getDatabase()
  const items = await db.collection<ProductItem>("products").find({state:"error"}).toArray();
  return items
}

export const activateProduct = async (sku: string, item_id: string) => {
  const db = getDatabase();
  const result = await db
    .collection<ProductItem>("products")
    .updateOne({ sku }, { $set: { state: "active", item_id } });
  return result.modifiedCount > 0;
};
