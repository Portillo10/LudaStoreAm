import { config } from 'dotenv'
config()

import { connectToDatabase } from '../src/db/database'
import { postedLinkExist } from '../src/db/models/postedLink'
import { getRandomUserAgent, readJSON, saveData, writeJSON } from "../src/utils/jsonHelper";
import { ItemsPage } from "../src/pages/ItemsPage";
import { chromium } from 'playwright';
import { input } from '../src/utils/inputHelper';
import { createProduct, ProductItem, getProductBySku } from "../src/db/models/product";
import { isForbiddenProduct } from '../src/utils/flitersHelper';
import { extractSKUFromUrl } from '../src/utils/helpers';


interface cookie {
  name: string,
  value: string,
  domain: string;
  path: string;
  expires: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite: "Strict" | "Lax" | "None";
}

(async () => {
  await connectToDatabase()
  const linksList: any[] = [{
    link: "https://www.amazon.com/-/es/PURITO-Clearing-Natural-vegana-crueldad/dp/B08JCRGRN5/ref=sr_1_22?dib=eyJ2IjoiMSJ9.tO0xkN_BfLDzOUAMQLabilssI3ddwoKpgdizt3vbDD6G5hpXjP-1L5_-y7caQeIiTOEIONJXbS3-01PPwwkFi2iqxu8mB-h8L970NpyliTpbVV2fEQRWGO87Ozl3s2onTtF3yg7n4LI7n6iH7XUQwxSWO8hWt4uLMcG30qBiXRn7s7e7CiOFrXnBLgbrKsTyk8_EufVpqxMpRLGSd5hz7vAq3d4OAuVlpi1FQ2dyS9BqJsjqcaKdoKMkJfnniAb8opJqeoPw-MtIJVu9acysS0ZltjiiDdVWEGHO3qnFB5E.MSbzkOax6VY1QM413Wgpw-08BieXrJ-46yV1lqQSFhg&dib_tag=se&qid=1723943647&refinements=p_85%3A2470955011%2Cp_72%3A1248873011&rnid=1248871011&rps=1&s=beauty&sr=1-22",
    title: ""
  },
  {
    link: "https://www.amazon.com/-/es/Garnier-Miracle-Perfector-Cream-hidrataci%C3%B3n/dp/B016FFRAWY/ref=sr_1_23?dib=eyJ2IjoiMSJ9.tO0xkN_BfLDzOUAMQLabilssI3ddwoKpgdizt3vbDD6G5hpXjP-1L5_-y7caQeIiTOEIONJXbS3-01PPwwkFi2iqxu8mB-h8L970NpyliTpbVV2fEQRWGO87Ozl3s2onTtF3yg7n4LI7n6iH7XUQwxSWO8hWt4uLMcG30qBiXRn7s7e7CiOFrXnBLgbrKsTyk8_EufVpqxMpRLGSd5hz7vAq3d4OAuVlpi1FQ2dyS9BqJsjqcaKdoKMkJfnniAb8opJqeoPw-MtIJVu9acysS0ZltjiiDdVWEGHO3qnFB5E.MSbzkOax6VY1QM413Wgpw-08BieXrJ-46yV1lqQSFhg&dib_tag=se&qid=1723943647&refinements=p_85%3A2470955011%2Cp_72%3A1248873011&rnid=1248871011&rps=1&s=beauty&sr=1-23",
    title: ""
  },
  {
    link: "https://www.amazon.com/-/es/Rosilliance-Mineral-Sunscreen-Spectrum-Reef-Safe/dp/B01EPC4FD6/ref=sr_1_24?dib=eyJ2IjoiMSJ9.tO0xkN_BfLDzOUAMQLabilssI3ddwoKpgdizt3vbDD6G5hpXjP-1L5_-y7caQeIiTOEIONJXbS3-01PPwwkFi2iqxu8mB-h8L970NpyliTpbVV2fEQRWGO87Ozl3s2onTtF3yg7n4LI7n6iH7XUQwxSWO8hWt4uLMcG30qBiXRn7s7e7CiOFrXnBLgbrKsTyk8_EufVpqxMpRLGSd5hz7vAq3d4OAuVlpi1FQ2dyS9BqJsjqcaKdoKMkJfnniAb8opJqeoPw-MtIJVu9acysS0ZltjiiDdVWEGHO3qnFB5E.MSbzkOax6VY1QM413Wgpw-08BieXrJ-46yV1lqQSFhg&dib_tag=se&qid=1723943647&refinements=p_85%3A2470955011%2Cp_72%3A1248873011&rnid=1248871011&rps=1&s=beauty&sr=1-24",
    title: ""
  },]

  const res = await Promise.all(linksList
    .filter(async (link) => {
      const sku = extractSKUFromUrl(link.link || '');
      const product = await getProductBySku(sku || '')
      if (product) {
        console.log('duplicado');
        console.log(product.sku);
        return false;
      }
      return (
        !isForbiddenProduct(link.title)
      );
    }))

  console.log(res);

})();
