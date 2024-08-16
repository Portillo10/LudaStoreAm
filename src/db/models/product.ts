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