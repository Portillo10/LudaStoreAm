import { input } from "../utils/inputHelper";
import { getRandomUserAgent, readJSON, writeJSON } from "../utils/jsonHelper";
import { chromium } from "playwright";
import { solveCaptcha } from "../utils/scrapeHelper";
import { sleep } from "../utils/helpers";

interface cookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite: "Strict" | "Lax" | "None";
}

(async () => {
  const miamiCodeZipList = [
    "33101",
    "33125",
    "33129",
    "33133",
    "33137",
    "33142",
    "33147",
    "33222",
    "33242",
  ];
  const codeZipIndex = Math.random();
  const miamiCodeZip = miamiCodeZipList[codeZipIndex];
  const browser = await chromium.launch({ headless: false });
  // const cookies: cookie[] = await readJSON("data/cookies.json");
  const randomUserAgent = await getRandomUserAgent();
  const newContext = await browser.newContext({
    userAgent: randomUserAgent,
    storageState: {
      cookies: [],
      origins: [
        {
          origin: "https://www.amazon.com/",
          localStorage: [],
        },
      ],
    },
  });
  const newPage = await newContext.newPage();
  await newPage.goto("https://www.amazon.com/", {
    waitUntil: "domcontentloaded",
  });

  const ubiSelector =
    "div.glow-toaster-footer.span.a-button.a-spacing-top-base.a-button-primary glow-toaster-button.glow-toaster-button-submit input.a-button-input";
  const captchaSelector =
    "form div.a-row.a-spacing-large div.a-box div.a-box-inner div.a-row.a-text-center img";
  // let ubiElement = await newPage.$(ubiSelector);
  let attemp = 0;
  try {
    // while (!ubiElement) {
    //   if (attemp >= 5) {
    //     throw new Error("Error resolviendo captcha");
    //   }
    //   await newPage.waitForLoadState("domcontentloaded");
    //   const captchaImage = newPage.locator(captchaSelector).first();
    //   if ((await captchaImage.count()) > 0) {
    //     await sleep(1000);
    //     const inputSelector = "#captchacharacters";
    //     const submitButtonSelector = "span.a-button-inner button.a-button-text";
    //     const path = "imgs/captcha.png";
    //     await captchaImage.screenshot({ path });
    //     const captchaText = await solveCaptcha(path);
    //     const input = newPage.locator(inputSelector).first();
    //     await input.fill(captchaText);
    //     await sleep(2000);
    //     const submitButton = newPage.locator(submitButtonSelector).first();
    //     await submitButton.click();
    //     try {
    //       await newPage.waitForSelector(ubiSelector, { timeout: 4000 });
    //     } catch (error) {}
    //     ubiElement = await newPage.$(ubiSelector);
    //   }
    //   attemp++;
    // }

    // await ubiElement.click();
    // const submitZipCodeSelector = "#GLUXZipUpdate input.a-button-input";
    // const inputZipCodeSelector = "#GLUXZipUpdateInput";
    // const confirmSelector = "#GLUXConfirmClose";

    // const inputZipCode = newPage.locator(inputZipCodeSelector);
    // await inputZipCode.fill(miamiCodeZip);
    // await sleep(1000);

    // const submitZipCode = newPage.locator(submitZipCodeSelector);
    // await submitZipCode.click();
    // await sleep(500);

    // const confirm = newPage.locator(confirmSelector);
    // await confirm.click();
    // await captchaImage.screenshot({path: 'captcha.png'})
    await input("presione cualquier tecla cuando haya acabado.");
    await newContext.storageState({ path: "data/state.json" });
    await newPage.close();
    await newContext.close();
    await browser.close();
    const newCookies = (await readJSON("data/state.json"))["cookies"];
    await writeJSON("data/cookies.json", newCookies);
  } catch (error) {
    console.log(error);
  }

  process.exit(0);
})();
