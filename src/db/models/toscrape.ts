import { DeleteOptions, Filter } from "mongodb";
import { getDatabase } from "../database";

export type ToScrape = {
  category_id: string;
  sku: string;
};

const getCollection = () => {
  const db = getDatabase();
  return db.collection<ToScrape>("toscrape");
};

export const getToScrape = async (filter: Filter<ToScrape>) => {
  const collection = getCollection();
  const result = await collection.find(filter).toArray();
  return result;
};

export const deleteScrape = async (
  filter: Filter<ToScrape>,
  deleteOptions: DeleteOptions
) => {
  const collection = getCollection();
  const result = await collection.deleteMany(filter, deleteOptions);
  return result;
};
