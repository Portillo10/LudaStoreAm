"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchPageContentProxy = exports.fetchPageContent = void 0;
const axios_1 = __importDefault(require("axios"));
const https_1 = __importDefault(require("https"));
const jsonHelper_1 = require("../utils/jsonHelper");
const helpers_1 = require("./helpers");
const scrapingBeeError_1 = require("../errors/scrapingBeeError");
const API_KEY = process.env.SCRAPINGBEE_API_KEY;
if (!API_KEY) {
    throw new Error('Falta la API key de ScrapingBee en el archivo .env');
}
const scrapingbeeUrl = 'https://app.scrapingbee.com/api/v1/';
const fetchPageContent = async (url) => {
    // const content = await readJSON('data/content.json')
    // if (Object.keys(content).includes(url)) {
    //   return content[url]
    // }
    const cookies = await (0, jsonHelper_1.loadAmazonCookies)();
    const maxRetries = 4;
    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            const response = await axios_1.default.get(scrapingbeeUrl, {
                params: {
                    url,
                    cookies,
                    api_key: API_KEY,
                    render_js: 'false',
                }
            });
            return response.data;
        }
        catch (error) {
            attempt++;
            console.error(`Error fetching data from ScrapingBee (attempt ${attempt}):`);
            await (0, helpers_1.sleep)(100);
            // if (attempt >= maxRetries) {
            //   throw error;
            // }
        }
    }
    throw new scrapingBeeError_1.ScrapingBeeError('Max retries reached');
};
exports.fetchPageContent = fetchPageContent;
const fetchPageContentProxy = async (url) => {
    // const content = await readJSON('data/content.json')
    // if (Object.keys(content).includes(url)) {
    //   return content[url]
    // }
    const agent = new https_1.default.Agent({
        rejectUnauthorized: false
    });
    const cookies = await (0, jsonHelper_1.loadAmazonCookies)();
    const maxRetries = 3;
    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            const response = await axios_1.default.get(url, {
                params: {
                    cookies,
                },
                proxy: {
                    protocol: 'https',
                    host: 'proxy.scrapingbee.com',
                    port: 8887,
                    auth: {
                        username: API_KEY,
                        password: "render_js=false"
                    }
                },
                httpAgent: agent
            });
            // content[url] = response.data
            // await writeJSON('data/content.json', content)
            return response.data;
        }
        catch (error) {
            attempt++;
            console.error(`Error fetching data from ScrapingBee (attempt ${attempt}):`);
            await (0, helpers_1.sleep)(100);
            if (attempt >= maxRetries) {
                throw error;
            }
        }
    }
    throw new Error('Max retries reached');
};
exports.fetchPageContentProxy = fetchPageContentProxy;
