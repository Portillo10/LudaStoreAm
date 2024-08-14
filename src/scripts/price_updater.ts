import { config } from "dotenv";
config();

import { Cheerio } from "../models/CheerioModel";
import { sleep } from "../utils/helpers";
import { fetchPageContent } from "../utils/scrapingBeeClient";
import { saveData } from "../utils/jsonHelper";
import { getRandomUserAgent, loadAmazonCookies } from "../utils/jsonHelper";
import axios, { AxiosError, AxiosResponse } from "axios";

const baseUrl =
  "https://www.amazon.com/-/es/s?k=maquinaria+pesada&i=industrial&rh=n%3A16310091%2Cn%3A256346011%2Cn%3A383596011%2Cp_36%3A27500-&dc&language=es&__mk_es_US=%C3%85M%C3%85%C5%BD%C3%95%C3%91";

const updateByUrl = async (url: string) => {
  let currentUrl: string | null = url;
  while (currentUrl) {
    const content = await fetchPageContent(currentUrl);
    if (!content) break;
    const cheerio = new Cheerio(content);
    const items = cheerio.getPricesAndSku();
    currentUrl = cheerio.getNextPageLink();
    saveData(items, "data/price_tracker.json");
    sleep(5000);
  }
};

const updateWithAxios = async (url: string) => {
  let currentUrl: string | null = url;
  const userAgent = await getRandomUserAgent();
  const cookies = await loadAmazonCookies();
  while (currentUrl) {
    try {
      const response = await axios.get(currentUrl, {
        headers: { "User-Agent": userAgent },
        params: { cookies },
      });
      if (!response) throw new Error("Error en la respuesta");
      console.log(response.status);
      if (response.status !== 200) break;
      const cheerio: Cheerio = new Cheerio(response.data);
      const items = cheerio.getPricesAndSku();
      currentUrl = cheerio.getNextPageLink();
      saveData(items, "data/price_tracker.json");
      sleep(5000);
    } catch (error) {
      if (error instanceof AxiosError) {
        console.log(error.message);
      }
    }
    sleep(5000);
  }
};

updateWithAxios(baseUrl);
