import { config } from "dotenv";
config();
import { connectToDatabase } from "../db/database";
import { getStoreByAlias, setProducts } from "../db/models/store";
import { getByCategories } from "../db/models/product";
import { input } from "../utils/inputHelper";

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

const run = async () => {
  await connectToDatabase();
  const store = await getStoreByAlias("LudaStore");
  if (store) {
    const products = await getByCategories(categories);
    const skuList = products
      .map((product) => product.sku)
      .filter((sku) => sku != null);

    console.log(skuList.length);

    await setProducts(skuList, store._id);
  }
  process.exit(0);
};

run();
