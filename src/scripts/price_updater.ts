import { config } from "dotenv";
config();

import { Cheerio } from "../models/CheerioModel";
import { sleep } from "../utils/helpers";
import { fetchPageContent } from "../utils/scrapingBeeClient";
import { saveData } from "../utils/jsonHelper";
import { getRandomUserAgent, loadAmazonCookies } from "../utils/jsonHelper";
import axios, { AxiosError, AxiosResponse, isAxiosError } from "axios";
import { connectToDatabase } from "../db/database";
import { getProduct, getProducts, updateProduct } from "../db/models/product";
import { calculatePrice } from "../services/putPrice";
import { getStoreByAlias } from "../db/models/store";
import { refreshAccessToken } from "../services/auth";
import { getUsdToCopRate } from "../services/forex";
import { updatePrice } from "../services/mlItems";
import { input } from "../utils/inputHelper";
import { getProducStore } from "../db/models/productStore";

(async () => {
  await connectToDatabase();

  const store = await getStoreByAlias("LudaStore");

  let token = await refreshAccessToken(store.alias);
  if (!token) throw new Error("Error obteniendo token de acceso");

  let usdRate = await getUsdToCopRate();
  if (!usdRate) throw new Error("Error obteniendo precio del dolar");

  const products = await getProducStore({store_id:store._id})

  //   const products = await getProducts({
  //     sku: { $in: store.skuList.map((item) => item.sku) },
  //     state: "updated",
  //   });

  //   console.log(products.length);

  //   const productList = products.reduce((acc, value) => {

  //   }, {});

  let updated = 0;

  for (const item of products) {
    const product = await getProduct(
      { sku: item.productSku, state: "updated" },
      {
        projection: {
          pictures: 0,
          attributes: 0,
          description: 0,
          title: 0,
        },
      }
    );

    if (product && item.item_id) {
      console.log(item.item_id);

      try {
        const newPrice = await calculatePrice(product, token, usdRate);
        // console.log(newPrice);
        // console.log(item.sku);
        await updatePrice(token, item.item_id, newPrice["unit_price"]);
        await updateProduct(
          { _id: product._id },
          { $set: { state: "active" } }
        );
        updated++;
        console.log(`${updated} productos actualizados`);
      } catch (error) {
        if (isAxiosError(error)) {
          console.log(error.response?.data.message);
        } else {
          console.log(error);
        }
      }
      await sleep(500);
    }
  }
  process.exit(0)
})();
