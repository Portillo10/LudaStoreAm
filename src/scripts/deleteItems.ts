import { config } from "dotenv";
config();
import { connectToDatabase } from "../db/database";
import { refreshAccessToken } from "../services/auth";
import {
  deleteItemById,
  getItemsByItemId,
  getItemsByScrollId,
} from "../services/mlItems";
import { chunkArray } from "../utils/taskExecutor";
import { getByItemId, getProductBySku } from "../db/models/product";
import { saveData } from "../utils/jsonHelper";
import {
  createItem,
  deleteItemByItemId,
  getAllItems,
  removeDuplicates,
} from "../db/models/Item";
import { input } from "../utils/inputHelper";
import { sleep } from "../utils/helpers";

(async () => {
  await connectToDatabase();
  let token = await refreshAccessToken();
  if (!token) throw new Error("Error access_token");
//   await removeDuplicates();
  const items = await getAllItems();
  for (const item of items) {
    console.log(item.item_id);
    await deleteItemById(item.item_id, token);
    const deleted = await deleteItemByItemId(item.item_id);
    if (deleted) {
      console.log("eliminado con éxito");
    } else {
      console.log("problemas eliminando");
    }
    // await input("Press any key")
    // await sleep(600)
  }
})();
