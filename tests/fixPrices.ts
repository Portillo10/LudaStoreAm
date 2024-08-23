import { config } from "dotenv";
config();
import { connectToDatabase } from "../src/db/database";
import { getProductBySku, getActiveProducts, updateState } from "../src/db/models/product";
import { Product } from "../src/models/Product";
import { postProduct } from "../src/services/pubs";
import { updatePrice } from "../src/services/putPrice";
import { getUsdToCopRate } from "../src/services/forex";

import { refreshAccessToken } from "../src/services/auth";
import { input } from "../src/utils/inputHelper";
import { sleep } from "../src/utils/helpers";


(async () => {
    try {
      await connectToDatabase();
      let token = await refreshAccessToken()
      //   "APP_USR-6850630523210149-081909-41688f4cc43caaae27f76155a62fd095-1242366457";
      const usdRate = await getUsdToCopRate() || 4029;
      const items = await getActiveProducts();
      console.log(items.length);
      await input("press any.")
    //   let option = "s"

      let count = 0

      for (const item of items){
        if (count % 5000 == 0){
            token = await refreshAccessToken()
        }
        console.log(item.sku);
        try {
            await updatePrice(item, token, usdRate)
            const updated = await updateState(item.sku || '', "updated")
            // console.log(updated)
            count++
            // if (count < 5){
            //     await input("press any")
            // }
        } catch (error) {
            console.log(error);
            sleep(200)
        }
        await sleep(500)
      }
      
    } catch (error) {
      
    }
  })();