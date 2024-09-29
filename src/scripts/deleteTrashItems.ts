import { config } from "dotenv";
config();
import { connectToDatabase } from "../db/database";
import { getStoreByAlias, setProducts } from "../db/models/store";
import { getByCategorie, getByCategories, getProductByItemId } from "../db/models/product";
import { input } from "../utils/inputHelper";
import { deleteItemById, getAllItemIds } from "../services/mlItems";
import { refreshAccessToken } from "../services/auth";
import { readJSON, saveData } from "../utils/jsonHelper";
import { sleep } from "../utils/helpers";

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

(async () => {
    await connectToDatabase()

    const store = await getStoreByAlias("LudaStore")
    if (!store) throw new Error("No se encontró la tienda")

    let token = await refreshAccessToken(store.alias)

    // const products = await getByCategorie(categories)

    // console.log(products.length);
    

    // const itemIdList = await readJSON("data/ml_ids.json")
    const itemIdList = await getAllItemIds(token, store.user_id)


    console.log(itemIdList.length);
    await saveData(itemIdList, "data/ml_ids.json")
    // await input("continue")

    for (const item_id of itemIdList){
        const product = await getProductByItemId(item_id)
        if (!product){
            console.log(item_id);
            await deleteItemById(item_id, token)
        }
    }
    process.exit(0)
})()