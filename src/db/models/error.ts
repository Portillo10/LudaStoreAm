import { ObjectId } from "mongodb";
import { getDatabase } from "../database";

export interface Error {
  _id?: ObjectId;
  link: string;
  category_id: string;
  errorTime: Date;
  errorMsg: string;
}

export const insertError = async (error: Error) => {
    const db = getDatabase()
    const result = db.collection("errors").insertOne(error)
}
