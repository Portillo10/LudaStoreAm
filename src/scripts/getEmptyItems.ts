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
  getByItemId,
  getProductBySku,
  setError,
  updateState,
} from "../db/models/product";
import { saveData } from "../utils/jsonHelper";
import { createItem } from "../db/models/Item";
import { input } from "../utils/inputHelper";
import { sleep } from "../utils/helpers";

(async () => {
  await connectToDatabase();
  let token = await refreshAccessToken("PortilloStore");
  console.log(`token: ${token}`);

  let scrollId =
    "eyJpZCI6Ik1DTzI2MjcyNzQxMDgiLCJudW1lcmljX2lkIjoyNjI3Mjc0MTA4LCJzdG9wX3RpbWUiOiIyMDQ0LTA4LTE3VDA0OjAwOjAwLjAwMFoifQ==";
  let currentResults: any | null = [];

  let total = 0;

  try {
    while (currentResults) {
      const { results, scroll_id } = await getItemsByScrollId(scrollId, token);
      if (scroll_id) {
        currentResults = results;
        scrollId = scroll_id;
        console.log(scroll_id);
      } else {
        currentResults = null;
        await input("press any key, scroll null");
        break;
      }

      // console.log(results);
      if (results) {
        const resultArray = chunkArray(results, 20);
        for (const result of resultArray) {
          const items: { id: string; attributes: any[]; status: string }[] =
            (await getItemsByItemId(result, token)) || [];
          // console.log(items);
          for (const item of items) {
            total++;
            if (item.id == "MCO2613617958") continue;
            const { id, attributes } = item;
            let sku = "";
            if (attributes) {
              const { value_name } = attributes.find(
                (attribute) => attribute.id == "SELLER_SKU"
              ) || { value_name: "" };
              sku = value_name;
            }
            // console.log(`sku: ${sku}`);
            const product = await getByItemId(id);

            if (item.status !== "active") {
              console.log(product?.sku, "-", item.id, item.status);
              try {
                await deleteItemById(id, token);
              } catch (error) {}

              await setError(product?.sku || "");
              console.log("");
              await sleep(500);
            } else if (!product) {
              console.log(item.id);
              try {
                await deleteItemById(id, token);
              } catch (error) {}
              console.log("");
              await sleep(500);
            }

            // if (!product) {
            //   const amProduct = await getProductBySku(sku);
            //   if (!amProduct) {
            //     const created = await createItem({
            //       item_id: id,
            //       sku,
            //       attributes,
            //       data: item,
            //     });
            //     if (created) {
            //       // console.log("guardado con éxito");
            //     } else {
            //       console.log("No se guardó el item");
            //       await saveData(
            //         { sku, id, attributes, item },
            //         "data/black_skus.json"
            //       );
            //     }
            //   }
            // }
          }
          await sleep(500)
        }
        await sleep(500);
      }
    }
  } catch (error) {
    console.log(error);
  } finally {
    console.log(`Productos: ${total}`);
  }
})();
