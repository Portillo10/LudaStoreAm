import { Filter, FindOptions, ObjectId, UpdateFilter } from "mongodb";
import { getDatabase } from "../database";
import { Attributes } from "../../types";
import { Product } from "../../models/Product";
import { addProduct } from "./store";

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
  condition: "new" | "refurbished";
}

export const getCollection = () => {
  const db = getDatabase();
  const collection = db.collection<ProductItem>("products");
  return collection;
};

export const createProduct = async (
  product: ProductItem
  // storeId: ObjectId
) => {
  const collection = getCollection();
  const productExist = await getProductBySku(product.sku || "");
  if (productExist) return null;
  const result = await collection.insertOne(product);
  // if (result) {
  //   const added = await addProduct(storeId, {
  //     sku: product.sku,
  //     item_id: product.item_id,
  //   });
  //   return result && added;
  // }
  return false;
};

export const getProduct = async (
  filter: Filter<ProductItem>,
  findOptions: FindOptions<ProductItem>
) => {
  const db = getDatabase();
  const item = await db
    .collection<ProductItem>("products")
    .findOne(filter, findOptions);
  return item;
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

export const activateProduct = async (
  sku: string,
  item_id: string,
  storeId: ObjectId
) => {
  const db = getDatabase();
  const result = await db
    .collection<ProductItem>("products")
    .updateOne({ sku }, { $set: { state: "active", item_id } });
  await addProduct(storeId, { sku, item_id });
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

export const deleteByIds = async (ids: ObjectId[]) => {
  const db = getDatabase();
  const collection = db.collection<ProductItem>("products");
  const result = await collection.deleteMany({ _id: { $in: ids } });
  return result.deletedCount;
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
    throw error;
  }
}

export const getBadWeight = async (category: string) => {
  const db = getDatabase();
  const collection = db.collection<ProductItem>("products");
  const result = await collection
    .find({ category_id: category, weight: "1 lb" })
    .toArray();
  return result;
};

export const updateProduct = async (
  filter: Filter<ProductItem>,
  update: UpdateFilter<ProductItem>
) => {
  const collection = getCollection();
  const result = await collection.updateOne(filter, update);
  return result.modifiedCount > 0;
};

export const getByCategories = async (categories: string[]) => {
  const db = getDatabase();
  const collection = db.collection<ProductItem>("products");
  const result = await collection
    .find({ category_id: { $in: categories }, item_id: { $ne: null } })
    .toArray();
  return result;
};

export const getByCategoriesAndState = async (
  categories: string[],
  state: string
) => {
  const db = getDatabase();
  const collection = db.collection<ProductItem>("products");
  const result = await collection
    .find({
      category_id: { $in: categories },
      item_id: { $ne: null },
      state,
    })
    .toArray();
  return result;
};

export const getByCategorie = async (categories: string[]) => {
  const db = getDatabase();
  const collection = db.collection<ProductItem>("products");
  const result = await collection
    .find(
      {
        category_id: { $in: categories },
        state: { $nin: ["pending", "omited"] },
      },
      { projection: { pictures: 0, attributes: 0, description: 0 } }
    )
    .toArray();
  return result;
};

export const getRefurbishedByCategories = async (categories: string[]) => {
  const db = getDatabase();
  const collection = db.collection<ProductItem>("products");
  const result = await collection
    .find({
      category_id: { $in: categories },
      item_id: { $ne: null },
      condition: "refurbished",
    })
    .toArray();
  return result;
};

export const setError = async (sku: string) => {
  const db = getDatabase();
  const collection = db.collection<ProductItem>("products");
  const result = await collection.updateOne(
    { sku },
    { $set: { state: "error", item_id: null } }
  );
  return result.modifiedCount > 0;
};

export const updateItemCondition = async (
  condition: "new" | "refurbished",
  _id: ObjectId
) => {
  const collection = getCollection();
  const result = await collection.updateOne({ _id }, { $set: { condition } });
  return result.modifiedCount > 0;
};

export const deleteItemId = async (_id: ObjectId) => {
  const collection = getCollection();
  const result = await collection.updateOne(
    { _id },
    { $set: { state: "deleted" } }
  );
  return result.matchedCount > 0;
};

export const setPrice = async (_id: ObjectId, price: number) => {
  const collection = getCollection();
  const result = await collection.updateOne({ _id }, { $set: { price } });
  return result.modifiedCount > 0;
};

export const deleteProductById = async (_id: ObjectId) => {
  const collection = getCollection();
  const result = await collection.deleteOne({ _id });
  return result.deletedCount > 0;
};

export const getProducts = async (
  filters: Filter<ProductItem>,
  projection: any
) => {
  const collection = getCollection();
  const result = await collection
    .find(filters, {
      projection,
    })
    .toArray();
  return result;
};

export const getProductsBySkuList = async (skuList: string[]) => {
  const result = await getProducts(
    { sku: { $in: skuList } },
    {
      pictures: 0,
      description: 0,
      attributes: 0,
    }
  );
  return result;
};

export const getProductsBySku = async (sku: string) => {
  const collection = getCollection();
  const result = await collection.find({ sku }).toArray();
  return result;
};

export const getPendingProducts = async () => {
  const collection = getCollection();
  const result = await collection
    .find({ state: "pending", condition: { $ne: "refurbished" } })
    .toArray();
  return result;
};

export const setDescription = async (_id: ObjectId, description: string) => {
  const collection = getCollection();
  const result = await collection.updateOne({ _id }, { $set: { description } });
  return result.modifiedCount > 0;
};

export const getProductByItemId = async (item_id: string) => {
  const collection = getCollection();
  const result = await collection.findOne(
    { item_id },
    {
      projection: {
        _id: 0,
        pictures: 0,
        attributes: 0,
        description: 0,
        title: 0,
        price: 0,
        sku: 0,
        weight: 0,
      },
    }
  );
  return result;
};
