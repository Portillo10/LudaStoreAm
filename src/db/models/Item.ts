import { ObjectId } from "mongodb";
import { getDatabase } from "../database";

export interface Item {
  _id?: ObjectId;
  sku: string | null;
  price: number | null;
  weight: string | null | number;
  dimensions: string | null | number;
  title: string | null;
  category_id: string | null;
  item_id: string | null;
  state: string;
}

export const createItem = async (item: Item) => {
  const db = getDatabase();
  const result = await db.collection("items").insertOne(item);
  return result.insertedId;
};

export const getAllItems = async (): Promise<Item[]> => {
  const db = getDatabase();
  const items = await db.collection<Item>("items").find().toArray();
  return items;
};

export const itemExistBySku = async (sku: string) => {
  const db = getDatabase();
  const item = await db.collection<Item>("items").findOne({ sku });
  return item ? true : false
};
