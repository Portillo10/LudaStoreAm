import { deleteLink } from "../src/db/models/link";
import { itemExistBySku } from "../src/db/models/Item";

import { connectToDatabase } from "../src/db/database";

(async () => {
  await connectToDatabase();

  // const deleted = await deleteLink("www.tumadre.com");
  const deleted = await itemExistBySku("B015XII6Q8")

  console.log(deleted);
})();
