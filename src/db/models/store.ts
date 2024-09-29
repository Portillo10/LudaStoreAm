import { ObjectId } from "mongodb";
import { getDatabase } from "../database";

type Item = {
  sku: string | null;
  item_id: string | null;
};

type Store = {
  client_id: string;
  client_secret: string;
  refresh_token: string;
  user_id: string;
  alias: string;
  skuList: Item[];
};

const getCollection = () => {
  const db = getDatabase();
  const collection = db.collection<Store>("stores");
  return collection;
};

export const getStoreByAlias = async (alias: string) => {
  const collection = getCollection();
  const result = await collection.findOne({ alias });
  if (!result) throw new Error("No se encontró la tienda");
  return result;
};

export const refreshStoreToken = async (
  alias: string,
  refreshToken: string
) => {
  const collection = getCollection();
  const result = await collection.updateOne(
    { alias },
    { $set: { refresh_token: refreshToken } }
  );
  return result.modifiedCount > 0;
};

export const setProducts = async (skuList: Item[], id: ObjectId) => {
  const collection = getCollection();
  const result = await collection.updateOne({ _id: id }, { $set: { skuList } });
  return result.modifiedCount > 0;
};

export const addProduct = async (_id: ObjectId, product: Item) => {
  const collection = getCollection();
  const result = await collection.updateOne(
    { _id },
    { $push: { skuList: product } }
  );
  return result.modifiedCount > 0;
};

export const renameProducts = async () => {
  const collection = getCollection();
  const result = await collection.updateMany(
    {},
    { $rename: { products: "skuList" } }
  );
};
