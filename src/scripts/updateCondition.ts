import { config } from "dotenv";
config();
import { connectToDatabase } from "../db/database";
import {
  deleteItemId,
  getByCategories,
  getByCategoriesAndState,
  ProductItem,
  setPrice,
  updateItemCondition,
  updateState,
} from "../db/models/product";
import { Cheerio } from "../models/CheerioModel";
import { fetchPageContent } from "../utils/scrapingBeeClient";
import { input } from "../utils/inputHelper";
import { sleep } from "../utils/helpers";
import { runTasksVoid } from "../utils/taskExecutor";

const categories = [
  "MCO38942",
  "MCO1015",
  "MCO3691",
  "MCO6872",
  "MCO167791",
  "MCO4707",
  "MCO1042",
  "MCO114643",
  "MCO50217",
  "MCO7908",
  "MCO417788",
  "MCO4192",
  "MCO8431",
  "MCO4702",
  "MCO59824",
  "MCO403380",
  "MCO11889",
  "MCO40736",
  "MCO3697",
  "MCO14903",
  "MCO176837",
  "MCO3384",
  "MCO441996",
  "MCO87920",
  "MCO416860",
  "MCO180784",
  "MCO116348",
  "MCO412007",
  "MCO177998",
  "MCO442223",
  "MCO173788",
  "MCO414014",
  "MCO177999",
  "MCO176296",
  "MCO424978",
  "MCO178000",
  "MCO116352",
  "MCO173824",
  "MCO87926",
  "MCO412401",
  "MCO441494",
  "MCO4275",
  "MCO29465",
  "MCO3018",
  "MCO180028",
  "MCO8436",
  "MCO3011",
  "MCO166528",
  "MCO4633",
  "MCO442189",
  "MCO1014",
  "MCO417360",
  "MCO8937",
  "MCO3770",
  "MCO442129",
  "MCO3772",
  "MCO442023",
  "MCO166576",
  "MCO166465",
  "MCO416667",
  "MCO416668",
  "MCO372121",
  "MCO8456",
  "MCO3014",
  "MCO6645",
];

const update = async (product: ProductItem) => {
  if (!product._id) throw new Error("")
  try {
    let content
    try {
      content = await fetchPageContent(
        `https://www.amazon.com/dp/${product.sku}`
      );
    } catch (error) {
      await deleteItemId(product._id);
      console.log(`${product.sku} eliminado de mercadolibre`);
      
    }
    if (!content) throw new Error("Contenido no disponible")
    const cheerio = new Cheerio(content);
    const condition = cheerio.getItemCondition();
    const price = cheerio.getPrice();
    console.log(
      `${condition} - ${product.sku} - original price: ${product.price} / new price: ${price}`
    );
    if (condition != "new") {
      const updated = await updateItemCondition(condition, product._id);
      console.log(updated);
      // await updateState(product.sku || "", "updated");
      if (!price) {
        const deleted = await deleteItemId(product._id);
        console.log(
          deleted ? "item_id eliminado" : "no se pudo eliminar el item_id"
        );
        return null
      }
    }
    if (price) {
      if (price != product.price) {
        await setPrice(product._id, price);
        await updateState(product.sku || "", "updated");
        return null;
      }
    } else {
      const deleted = await deleteItemId(product._id);
      console.log(
        deleted ? "item_id eliminado" : "no se pudo eliminar el item_id"
      );
    }

    await updateState(product.sku || "", "revised");
    await sleep(700);
  } catch (error) {}
  return null
}

(async () => {
  await connectToDatabase();

  const products = await getByCategoriesAndState(categories, "active");
  console.log(products.length);

  await input("press enter to continue");
  await runTasksVoid<ProductItem, null>(products, update, 5)

  console.log(products.length);
})();
