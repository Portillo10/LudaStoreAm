import {config} from 'dotenv'
config()

import {connectToDatabase} from '../src/db/database'
import {postedLinkExist} from '../src/db/models/postedLink'
import { getRandomUserAgent, readJSON, saveData, writeJSON } from "../src/utils/jsonHelper";
import { ItemsPage } from "../src/pages/ItemsPage";
import { chromium } from 'playwright';
import { input } from '../src/utils/inputHelper';

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
  // const link = await postedLinkExist("https://www.amazon.com/s?i=beauty&rh=n%3A7792268011%2Cp_85%3A2470955011%2Cp_72%3A1248873011&dc&fs=true&language=es&ds=v1%3ABS7YatqJUl6VsyVHU2w5jtt9G5KZlAR35mXvR4TlkOo&qid=1720219823&rnid=1248871011&ref=sr_nr_p_72_1")
  // console.log(link);
  const proxy = {
    server: '1T3DAUN2N4CFZG0Q88ILN2AQFQFRL802DTPBE6S6Q5SH5D52JMU0Y5ALWVICBUEEAG24JRO003NZTG8S:render_js=false@proxy.scrapingbee.com:8887'
  }

  const browser = await chromium.launch({ headless: false, proxy:{
    server: "proxy.scrapingbee.com:8886",
    username: "1T3DAUN2N4CFZG0Q88ILN2AQFQFRL802DTPBE6S6Q5SH5D52JMU0Y5ALWVICBUEEAG24JRO003NZTG8S",
    password: "render_js=false"
  } });

  const cookies: cookie[] = await readJSON("data/cookies.json")
  const randomUserAgent = await getRandomUserAgent()
  const context = await browser.newContext({
    userAgent: randomUserAgent, storageState: {
      cookies,
      origins: [{
        origin: "https://www.amazon.com/",
        localStorage: []
      }]
    }
  });
  const itemsPage = new ItemsPage(context);
  await itemsPage.navigateTo("https://www.amazon.com/s?i=beauty&rh=n%3A7792268011%2Cp_85%3A2470955011%2Cp_72%3A1248873011&dc&fs=true&language=es&ds=v1%3ABS7YatqJUl6VsyVHU2w5jtt9G5KZlAR35mXvR4TlkOo&qid=1720219823&rnid=1248871011&ref=sr_nr_p_72_1")
  input("press any key")
})();
