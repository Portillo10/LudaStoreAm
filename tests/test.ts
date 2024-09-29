import { config } from "dotenv";
config();

import { connectToDatabase } from "../src/db/database";
import { getAllSkus, postedLinkExist } from "../src/db/models/postedLink";
import { getAllItemIds } from "../src/services/mlItems";

(async () => {
  await connectToDatabase();

  const itemIds = await 

  // const skuList = await getAllSkus();

  // const uniqueList = skuList.reduce((acc, curr) => {
  //   if (!acc.includes(curr)) {
  //     acc.push(curr.sku);
  //   }
  //   return acc;
  // }, []);

  // console.log(uniqueList.length);

  process.exit(0);
})();
