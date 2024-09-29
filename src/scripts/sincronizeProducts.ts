import { config } from "dotenv";
config();

import { connectToDatabase } from "../db/database";
import { input } from "../utils/inputHelper";
import { updateProductStore } from "../db/models/productStore";
import { getProduct, getProductBySku, getProducts } from "../db/models/product";
import { isAxiosError } from "axios";
import { ObjectId } from "mongodb";

(async () => {
  await connectToDatabase();
  const products = await getProducts({ state: "updated" }, { sku: 1 });

  const skuList = products
    .map((product) => product.sku)
    .filter((sku) => sku != null);

  const updatedCount = await updateProductStore(
    { productSku: { $in: skuList } },
    { $set: { pendingUpdate: true, stock: 12 } }
  );

  console.log(updatedCount);

  process.exit(0);
})();
