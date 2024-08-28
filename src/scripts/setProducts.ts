import { config } from "dotenv";
config();
import { connectToDatabase } from "../db/database";
import { getStoreByAlias, setProducts } from "../db/models/store";
import { getByCategories } from "../db/models/product";
import { input } from "../utils/inputHelper";

const categories = [
  'MCO180928',
    'MCO417111',
    'MCO417111',
    'MCO417111',
    'MCO1259',
    'MCO157400',
    'MCO118184',
    'MCO429392',
    'MCO429392',
    'MCO429392',
    'MCO118184',
    'MCO118184',
    'MCO157399',
    'MCO157396',
    'MCO181069',
    'MCO157398',
    'MCO157398',
    'MCO167683',
    'MCO416984',
    'MCO157396',
    'MCO167685',
    'MCO4597',
    'MCO4598',
    'MCO4597',
    'MCO180960',
    'MCO180960',
    'MCO417035',
    'MCO181090',
    'MCO181090',
    'MCO118188',
    'MCO441193',
    'MCO441193',
    'MCO441193',
    'MCO441193',
    'MCO441193',
    'MCO180969',
    'MCO180965',
    'MCO8830',
];

const run = async () => {
  await connectToDatabase();
  const store = await getStoreByAlias("LudaStore");
  if (store) {
    const products = await getByCategories(categories);
    console.log(products.length);
    
    const items = products
      .map((product) => ({ sku: product.sku, item_id: product.item_id }))
      .filter((item) => item.sku != null && item.item_id != null);

    console.log(items.length);
    await input("Presione enter")
    // await setProducts(items, store._id);
  }
  process.exit(0);
};

run();
