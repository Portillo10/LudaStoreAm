import { connectToDatabase } from "../db/database";
import { getBadWeight, getProducts, updateProduct } from "../db/models/product";
import { input } from "../utils/inputHelper";

(async () => {
  await connectToDatabase();

  const products = await getProducts({}, { _id: 1, weight: 1, sku: 1 });

  let count = 0;
  for (const product of products) {
    const number = product.weight?.toString().split(" ")[0];
    if (!number) {
      console.log("Weight undefined");
    } else {
      const weight = parseInt(number);
      console.log(product.sku);
      await updateProduct({ _id: product._id }, { $set: { weight } });
    }
    count++;

    if (count % 800 == 0) console.log(`${count} de ${products.length}`);
  }
})();
