import { config } from "dotenv";
config()
import { connectToDatabase } from "../db/database";
import { insertError } from "../db/models/error";
import { activateProduct, getErrorProducts } from "../db/models/product";
import { Product } from "../models/Product";
import { refreshAccessToken } from "../services/auth";
import { getUsdToCopRate } from "../services/forex";
import { postProduct } from "../services/pubs";
import { sleep } from "../utils/helpers";
import { input } from "../utils/inputHelper";

(async () => {
  await connectToDatabase();
  let token = await refreshAccessToken();
  if (!token) throw new Error("No fue posible obtener el token");

  const usdRate = await getUsdToCopRate();
  if (!usdRate) throw new Error("No fue posible obtener el precio del dolar");
  const products = await getErrorProducts();
  console.log(products.length);

  await input("Desea continuar?");
  let posted = 0;
  for (const product of products) {
    // if (posted % 1000 == 0){
    //     token = await refreshAccessToken();
    // }
    try {
      const { _id, ...itemData } = product;
      const productData = new Product({
        title: "",
        price: 0,
        description: "",
        sku: "",
      });
      productData.setData(itemData);
      const { product_id, ml_price } = await postProduct(
        productData,
        token,
        usdRate
      );
      if (!product.sku) throw new Error("Sku no disponible");

      await activateProduct(product.sku, product_id);
      posted++;
    } catch (error) {
      await insertError({
        category_id: product.category_id || "",
        errorMsg: "Error publicando producto",
        link: `http://amazon.com/-/es/dp/${product.sku}`,
        errorTime: new Date(),
      });
    }
    await sleep(500);
  }
})();
