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
import {
  deleteById,
  deleteByItemId,
  getByItemId,
  getGroupedRecordsBySku,
  getProductBySku,
} from "../db/models/product";
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
  const products = await getGroupedRecordsBySku();
  console.log(products.length);
  //   await input("Press any");

  for (const chunk of products) {
    const item_ids = chunk.map((item) => ({
      id: item.item_id,
      sku: item.sku,
      ml_id: item._id,
    }));
    console.log(item_ids);

    const idList = item_ids
      .filter((item) => item.id != null)
      .map((item) => item.id);
    if (idList.length > 1) {
      const items = await getItemsByItemId(idList, token);
      if (!items) continue;
      for (const item of items) {
        const { status, id } = item;
        if (status != "active" && idList[0] !== idList[1]) {
          console.log(item_ids);
          console.log(status, id);
          await deleteItemById(item.id, token);
          await input("continue");
          const deleted = await deleteByItemId(item.id);
          if (!deleted) {
            await input("No se eliminó");
          }
        } else {
          // const product = await getByItemId(id)
        }
      }
    } else if (idList.length == 0 && item_ids.length > 1) {
      const [id, ...rest] = item_ids;
      const listId = rest.map(item => item.ml_id)
      console.log(listId);
      const deletedCount = await deleteById(listId)
      console.log(deletedCount);
    }
    await input("Press any to continue");
  }
})();
