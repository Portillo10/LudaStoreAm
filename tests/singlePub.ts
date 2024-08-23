import { config } from "dotenv";
config();
import { connectToDatabase } from "../src/db/database";
import { getProductBySku } from "../src/db/models/product";
import { Product } from "../src/models/Product";
import { postProduct } from "../src/services/pubs";
import { refreshAccessToken } from "../src/services/auth";

(async () => {
  try {
    await connectToDatabase();
    const token = await refreshAccessToken()
    //   "APP_USR-6850630523210149-081909-41688f4cc43caaae27f76155a62fd095-1242366457";
    const usdRate = 4029;

    const item = await getProductBySku("B0C1H51W4Z");
    if (!item) throw new Error("No se encontró el producto");
    const { _id, ...product } = item;
    const productData = new Product({
      title: "",
      price: 0,
      description: "",
      sku: "",
    });
    productData.setData(product);
    await postProduct(productData, token, usdRate);
  } catch (error) {
    
  }
})();
