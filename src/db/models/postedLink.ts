import { ObjectId } from "mongodb";
import { getDatabase } from "../database";

export interface link {
    _id?: ObjectId;
    link: string | null;
    category_id: string | null;
}

export const insertPostedLink = async (link: link) => {
    const db = getDatabase();
    const result = await db.collection("postedlinks").insertOne(link);
    return result.insertedId;
};

export const postedLinkExist = async (link: string) => {
    const db = getDatabase()
    const result = await db.collection<link>("postedlinks").findOne({link})
    return !!result
}