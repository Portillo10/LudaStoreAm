import { config } from "dotenv";
config();
import { connectToDatabase } from "../db/database";
import { getErrors, insertError } from "../db/models/error";
import {
  activateProduct,
  getErrorProducts,
  getPendingProducts,
  getProducts,
  setDescription,
  updateProduct,
  updateState,
} from "../db/models/product";
import { Product } from "../models/Product";
import { refreshAccessToken } from "../services/auth";
import { getUsdToCopRate } from "../services/forex";
import { postProduct } from "../services/pubs";
import { cleanDescription, removeContactInfo, sleep } from "../utils/helpers";
import { input } from "../utils/inputHelper";
import { getStoreByAlias, renameProducts } from "../db/models/store";
import { countProducts } from "../db/models/postedLink";
import {
  getOneProducStore,
  getProducStore,
  insertProductStore,
} from "../db/models/productStore";
import { stealthAttributes } from "../utils/attributesHelper";
import { cleanText, isForbiddenProduct } from "../utils/flitersHelper";

(async () => {
  await connectToDatabase();

  const store = await getStoreByAlias("HouseStore");

  let token = await refreshAccessToken(store.alias);

  // console.log(token);
  // await input("enter")

  if (!token) throw new Error("No fue posible obtener el token");

  const usdRate = await getUsdToCopRate();
  if (!usdRate) throw new Error("No fue posible obtener el precio del dolar");
  const products = await getProducts(
    {
      state: "omited",
      condition: "new",
      category_id: { $nin: ["MCO71419", "MCO1713"] },
    },
    {}
  );

  let posted = 0;
  let errors = 0;
  for (const product of products) {
    if (posted > 0 && posted % 3000 == 0) {
      token = await refreshAccessToken(store.alias);
    }
    if (posted >= 4000) {
      console.log(`límite alcanzado ${posted} productos publicados`);
      break;
    }

    try {
      if (!product.sku) throw new Error("Sku no disponible");
      const productStore = await getOneProducStore({
        productSku: product.sku,
        store_id: store._id,
      });

      if (productStore) {
        console.log(product.sku);

        console.log("producto duplicado");
        continue;
      }
      const { _id, attributes, ...itemData } = product;

      if (
        isForbiddenProduct(itemData.title || "") ||
        itemData.title?.toLocaleLowerCase().includes("refurbished")
      ) {
        console.log(itemData.title);
        await updateProduct(
          { sku: itemData.sku },
          { $set: { state: "ignored" } }
        );
        continue;
      }

      const productData = new Product({
        title: "",
        price: 0,
        description: "",
        sku: "",
      });

      const newAttributes = await stealthAttributes(
        itemData.category_id || "",
        attributes
      );

      const { description, ...restData } = itemData;
      productData.setData({
        ...restData,
        attributes: newAttributes,
        description: removeContactInfo(cleanText(description)),
      });
      const { product_id, ml_price } = await postProduct(
        productData,
        token,
        usdRate
      );

      await insertProductStore({
        productSku: product.sku,
        store_id: store._id,
        item_id: product_id,
        state: "active",
        pendingUpdate: false,
        stock: 12,
      });
      await updateState(product.sku, "active");
      posted++;
      console.log(`${posted} productos publicados, ${errors} omitidos`);
    } catch (error) {
      await insertError({
        category_id: product.category_id || "",
        errorMsg: "Error publicando producto",
        link: `http://amazon.com/-/es/dp/${product.sku}`,
        errorTime: new Date(),
      });
      await updateState(product.sku || "", "omited");

      errors++;
    }
    // await input("continue");
  }
  process.exit(0);
})();
