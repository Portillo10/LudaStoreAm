import { ObjectId } from "mongodb";
import { getDatabase } from "../database";

export interface link {
  _id?: ObjectId;
  link: string | null;
}

export const deleteLink = async (link: string) => {
  const db = getDatabase();
  const result = await db.collection("links").deleteOne({ link });
  return result.deletedCount > 0;
};

export const insertLinks = async (links: string[]) => {
  const db = getDatabase();
  const urlList: link[] = links.map((link) => {
    return { link };
  });
  const result = await db.collection("links").insertMany(urlList);
  return result.insertedCount;
};
