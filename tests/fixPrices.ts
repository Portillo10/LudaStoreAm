import { config } from "dotenv";
config();
import { connectToDatabase } from "../src/db/database";
import {
  getProductBySku,
  getActiveProducts,
  updateState,
  getByCategories,
} from "../src/db/models/product";
import { Product } from "../src/models/Product";
import { postProduct } from "../src/services/pubs";
import { updatePrice } from "../src/services/putPrice";
import { getUsdToCopRate } from "../src/services/forex";

import { refreshAccessToken } from "../src/services/auth";
import { input } from "../src/utils/inputHelper";
import { sleep } from "../src/utils/helpers";

(async () => {
  const categories = [
    "MCO38942",
    "MCO1015",
    "MCO6872",
    "MCO167791",
    "MCO3691",
    "MCO4707",
    "MCO1042",
    "MCO114643",
  ];
  try {
    await connectToDatabase();
    let token = await refreshAccessToken();
    //   "APP_USR-6850630523210149-081909-41688f4cc43caaae27f76155a62fd095-1242366457";
    const usdRate = (await getUsdToCopRate()) || 4029;
    const items = await getByCategories(categories);
    console.log(items.length);
    //   let option = "s"

    let count = 0;

    for (const item of items) {
      if (count % 5000 == 0) {
        token = await refreshAccessToken();
      }
      console.log(item.sku);
      // await input("presione cualquier tecla para continuar")
      try {
        await updatePrice(item, token, usdRate);
        count++;
        // const updated = await updateState(item.sku || '', "updated")
        // console.log(updated)
        // if (count < 5){
        //     await input("press any")
        // }
      } catch (error) {
        await sleep(200);
      }
      await sleep(700);
    }
  } catch (error) {}
})();
