import {
  Filter,
  FilterOperations,
  ObjectId,
  UpdateFilter,
  UpdateOptions,
} from "mongodb";
import { getDatabase } from "../database";

type ProducStore = {
  store_id: ObjectId;
  productSku: string;
  item_id: string;
  state: string;
  pendingUpdate: boolean;
  stock: number;
};

const getCollection = () => {
  const db = getDatabase();
  const collection = db.collection<ProducStore>("productstore");
  return collection;
};

export const insertProductStore = async (doc: ProducStore) => {
  const collection = getCollection();
  const result = await collection.insertOne(doc);
  return result.insertedId;
};

export const getProducStore = async (filter: Filter<ProducStore>) => {
  const collection = getCollection();
  const result = await collection.find(filter).toArray();
  return result;
};

export const getOneProducStore = async (filter: Filter<ProducStore>) => {
  const collection = getCollection();
  const result = await collection.findOne(filter);
  return result;
};

export const updateProductStore = async (
  filter: Filter<ProducStore>,
  updateOptions: UpdateFilter<ProducStore>
) => {
  const collection = getCollection();
  const result = await collection.updateMany(filter, updateOptions);
  return result.modifiedCount;
};
