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
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const CheerioModel_1 = require("../models/CheerioModel");
const helpers_1 = require("../utils/helpers");
const scrapingBeeClient_1 = require("../utils/scrapingBeeClient");
const jsonHelper_1 = require("../utils/jsonHelper");
const jsonHelper_2 = require("../utils/jsonHelper");
const axios_1 = __importStar(require("axios"));
const baseUrl = "https://www.amazon.com/-/es/s?k=maquinaria+pesada&i=industrial&rh=n%3A16310091%2Cn%3A256346011%2Cn%3A383596011%2Cp_36%3A27500-&dc&language=es&__mk_es_US=%C3%85M%C3%85%C5%BD%C3%95%C3%91";
const updateByUrl = async (url) => {
    let currentUrl = url;
    while (currentUrl) {
        const content = await (0, scrapingBeeClient_1.fetchPageContent)(currentUrl);
        if (!content)
            break;
        const cheerio = new CheerioModel_1.Cheerio(content);
        const items = cheerio.getPricesAndSku();
        currentUrl = cheerio.getNextPageLink();
        (0, jsonHelper_1.saveData)(items, "data/price_tracker.json");
        (0, helpers_1.sleep)(5000);
    }
};
const updateWithAxios = async (url) => {
    let currentUrl = url;
    const userAgent = await (0, jsonHelper_2.getRandomUserAgent)();
    const cookies = await (0, jsonHelper_2.loadAmazonCookies)();
    while (currentUrl) {
        try {
            const response = await axios_1.default.get(currentUrl, {
                headers: { "User-Agent": userAgent },
                params: { cookies },
            });
            if (!response)
                throw new Error("Error en la respuesta");
            console.log(response.status);
            if (response.status !== 200)
                break;
            const cheerio = new CheerioModel_1.Cheerio(response.data);
            const items = cheerio.getPricesAndSku();
            currentUrl = cheerio.getNextPageLink();
            (0, jsonHelper_1.saveData)(items, "data/price_tracker.json");
            (0, helpers_1.sleep)(5000);
        }
        catch (error) {
            if (error instanceof axios_1.AxiosError) {
                console.log(error.message);
            }
        }
        (0, helpers_1.sleep)(5000);
    }
};
updateWithAxios(baseUrl);
