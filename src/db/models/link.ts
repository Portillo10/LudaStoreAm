import { ObjectId } from "mongodb";
import { getDatabase } from "../database";

export interface link {
  _id?: ObjectId;
  link: string | null;
  category_id: string | null;
}

export const deleteLink = async (link: string) => {
  const db = getDatabase();
  const result = await db.collection("links").deleteOne({ link });
  return result.deletedCount > 0;
};

export const insertLinks = async (links: string[], category: string) => {
  const db = getDatabase();
  const urlList: link[] = links.map((link) => {
    return { link, category_id:category };
  });
  const result = await db.collection("links").insertMany(urlList);
  return result.insertedCount;
};
