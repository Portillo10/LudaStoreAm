"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchPageContentProxy = exports.fetchPageContent = void 0;
const axios_1 = __importStar(require("axios"));
const https_1 = __importDefault(require("https"));
const jsonHelper_1 = require("../utils/jsonHelper");
const helpers_1 = require("./helpers");
const API_KEY = process.env.SCRAPINGBEE_API_KEY;
if (!API_KEY) {
    throw new Error("Falta la API key de ScrapingBee en el archivo .env");
}
const scrapingbeeUrl = "https://app.scrapingbee.com/api/v1/";
const fetchPageContent = async (url) => {
    // const content = await readJSON('data/content.json')
    // if (Object.keys(content).includes(url)) {
    //   return content[url]
    // }
    const cookies = await (0, jsonHelper_1.loadAmazonCookies)();
    const maxRetries = 5;
    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            const response = await axios_1.default.get(scrapingbeeUrl, {
                params: {
                    url,
                    cookies,
                    api_key: API_KEY,
                    render_js: "false",
                },
            });
            return response.data;
        }
        catch (error) {
            attempt++;
            console.error(`Error fetching data from ScrapingBee (attempt ${attempt}):`);
            await (0, helpers_1.sleep)(100);
            if ((0, axios_1.isAxiosError)(error)) {
                console.log(error.response?.status);
                console.log(error.response?.data);
            }
            else if (error instanceof Error) {
                console.log(error.message);
            }
        }
    }
    await (0, jsonHelper_1.saveData)(url, "data/badUrls.json");
    return "";
    // throw new ScrapingBeeError("Max retries reached");
};
exports.fetchPageContent = fetchPageContent;
const fetchPageContentProxy = async (url) => {
    // const content = await readJSON('data/content.json')
    // if (Object.keys(content).includes(url)) {
    //   return content[url]
    // }
    const agent = new https_1.default.Agent({
        rejectUnauthorized: false,
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
                    protocol: "https",
                    host: "proxy.scrapingbee.com",
                    port: 8887,
                    auth: {
                        username: API_KEY,
                        password: "render_js=false",
                    },
                },
                httpAgent: agent,
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
    throw new Error("Max retries reached");
};
exports.fetchPageContentProxy = fetchPageContentProxy;
