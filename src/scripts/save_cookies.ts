import { input } from "../utils/inputHelper";
import { getRandomUserAgent, readJSON, writeJSON } from "../utils/jsonHelper";
import { chromium } from "playwright";

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
  const browser = await chromium.launch({ headless: false });
  const cookies: cookie[] = await readJSON("data/cookies.json")
  const randomUserAgent = await getRandomUserAgent()
  const newContext = await browser.newContext({
    userAgent: randomUserAgent, storageState: {
      cookies: cookies,
      origins:[ {
        origin: "https://www.amazon.com/",
        localStorage: []
      }]
  }});
  const newPage = await newContext.newPage();
  await newPage.goto("https://www.amazon.com/");
  await input("presione cualquier tecla cuando haya acabado.");
  await newContext.storageState({ path: "data/state.json" });
  await newPage.close();
  await newContext.close();
  await browser.close();
  const newCookies = (await readJSON('data/state.json'))["cookies"]
  await writeJSON("data/cookies.json", newCookies)
  process.exit(0);
})();
