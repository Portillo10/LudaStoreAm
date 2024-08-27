import { getDatabase } from "../database";
import { Task } from '../../models/taskManager'


const getCollection = () => {
  const db = getDatabase();
  const collection = db.collection<Task>("tasks");
  return collection;
};

export const createTask = async (task: Task) => {
  const collection = getCollection();
  const result = await collection.insertOne(task);
  return result.insertedId;
};

export const getTask = async () => {
  const collection = getCollection();
  const result = await collection.find().toArray();
  return result.length > 0 ? result[0] : null;
};

export const deleteLink = async (link: string) => {
  const collection = getCollection();
  const id = (await collection.find().toArray())[0]?._id;
  const result = await collection.updateOne(
    { _id: id },
    { $pull: { linkList: link } }
  );
  return result.modifiedCount > 0;
};

export const deleteTask = async () => {
  const collection = getCollection();
  const result = await collection.deleteMany({});
  return result.deletedCount > 0;
};

export const addLinks = async (links: string[]) => {
  const collection = getCollection();
  const id = (await collection.find().toArray())[0]?._id;
  const result = await collection.updateOne(
    { _id: id },
    {
      $set: {
        linkList: links,
      },
    }
  );
  return result.modifiedCount;
};

export const updateCurrentUrl = async (url: string | null) => {
  const collection = getCollection();
  const id = (await collection.find().toArray())[0]?._id;
  const result = await collection.updateOne(
    { _id: id },
    { $set: { currentUrl: url } }
  );
  return result.modifiedCount > 0
};
