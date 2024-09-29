"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const database_1 = require("../db/database");
const auth_1 = require("../services/auth");
const product_1 = require("../db/models/product");
const putPrice_1 = require("../services/putPrice");
const forex_1 = require("../services/forex");
(async () => {
    await (0, database_1.connectToDatabase)();
    let token = await (0, auth_1.refreshAccessToken)("PortilloStore");
    const usd_rate = await (0, forex_1.getUsdToCopRate)();
    // const browser = await chromium.launch({headless:false})
    // const page = await browser.newPage()
    // await page.goto("https://www.amazon.com/-/es/dp/B07RN6TSKF")
    // await input("pres any.")
    const product = await (0, product_1.getProductBySku)("B09MKJ942M");
    if (product && usd_rate) {
        const price = await (0, putPrice_1.calculatePrice)(product, token, usd_rate);
        console.log(price);
    }
})();
