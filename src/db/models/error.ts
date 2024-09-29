import { Filter, ObjectId } from "mongodb";
import { getDatabase } from "../database";

export interface Error {
  _id?: ObjectId;
  link: string;
  category_id: string;
  errorTime: Date;
  errorMsg: string;
}

export const insertError = async (error: Error) => {
  const db = getDatabase();
  const result = await db.collection("errors").insertOne(error);
};

export const getErrors = async () => {
  const db = getDatabase();
  const result = await db.collection<Error>("errors").find().toArray();
  return result;
};

export const getError = async (filter: Filter<Error>) => {
  const db = getDatabase()
  const result = await db.collection<Error>("errors").findOne(filter)
  return result
}