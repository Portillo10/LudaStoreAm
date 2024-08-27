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
import { calculatePrice } from "../services/putPrice";
import { getUsdToCopRate } from "../services/forex";
import { chromium } from "playwright";
import { input } from "../utils/inputHelper";

(async () => {
  await connectToDatabase();
  let token = await refreshAccessToken();
  const usd_rate = await getUsdToCopRate()

  // const browser = await chromium.launch({headless:false})

  // const page = await browser.newPage()

  // await page.goto("https://www.amazon.com/-/es/dp/B07RN6TSKF")

  // await input("pres any.")

  const product = await getProductBySku("B0D3KLZ423");
  if (product && usd_rate) {
    const price = await calculatePrice(product, token, usd_rate);
    console.log(price);
  }
})();
