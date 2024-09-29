import { ObjectId } from "mongodb";

export interface PostedLinkStore {
  postedLink_id: ObjectId;
  store_id: ObjectId;
  defaultWeight: string;
}
