import { ObjectId } from "mongodb";
import { getDatabase } from "../database";
import { input } from "../../utils/inputHelper";

export interface Item  {
  _id?: ObjectId;
  sku: string | null
  item_id:string
  attributes: any
  data: any
}

export const createItem = async (item: Item) => {
  const db = getDatabase();
  const result = await db.collection("mlitems").insertOne(item);
  return result.insertedId ? true : false;
};

export const getAllItems = async (): Promise<Item[]> => {
  const db = getDatabase();
  const items = await db.collection<Item>("mlitems").find().toArray();
  return items;
};

export const itemExistBySku = async (sku: string) => {
  const db = getDatabase();
  const item = await db.collection<Item>("items").findOne({ sku });
  return item ? true : false
};

export const getItemBySku = async (sku: string) => {
  const db = getDatabase();
  const item = await db.collection<Item>("items").findOne({ sku });
  return item
}

export const deleteItemByItemId = async (item_id: string) => {
  const db = getDatabase();
  const item = await db.collection<Item>("mlitems").deleteOne({ item_id });
  return item.deletedCount > 0
}



export const removeDuplicates = async () => {
  try {
    const db = getDatabase();
    const collection = db.collection("mlitems");

    // Identificar duplicados
    const pipeline = [
      {
        $group: {
          _id: {
            field1: "item_id", // Cambia esto a los campos que definen un duplicado
            // field2: "$field2", // Añade más campos si es necesario
          },
          count: { $sum: 1 },
          ids: { $push: "$_id" },
        },
      },
      {
        $match: {
          count: { $gt: 1 },
        },
      },
    ];

    const duplicates = await collection.aggregate(pipeline).toArray();
    console.log("Found duplicates:", duplicates.length);

    await input("press any key.")

    // Eliminar duplicados
    for (const doc of duplicates) {
      const [, ...idsToRemove] = doc.ids;
      await collection.deleteMany({
        _id: { $in: idsToRemove },
      });
    }

    console.log("Duplicates removed");
  } catch (error) {
    console.error("Error removing duplicates:", error);
  } finally {
  }
};
