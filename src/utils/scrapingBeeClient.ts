import axios, { isAxiosError } from "axios";
import https from "https";
import {
  loadAmazonCookies,
  readJSON,
  saveData,
  writeJSON,
} from "../utils/jsonHelper";
import { sleep } from "./helpers";
import { ScrapingBeeError } from "../errors/scrapingBeeError";

const API_KEY = process.env.SCRAPINGBEE_API_KEY;
if (!API_KEY) {
  throw new Error("Falta la API key de ScrapingBee en el archivo .env");
}

const scrapingbeeUrl = "https://app.scrapingbee.com/api/v1/";

export const fetchPageContent = async (url: string): Promise<string> => {
  // const content = await readJSON('data/content.json')
  // if (Object.keys(content).includes(url)) {
  //   return content[url]
  // }

  const cookies = await loadAmazonCookies();
  const maxRetries = 5;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const response = await axios.get(scrapingbeeUrl, {
        params: {
          url,
          cookies,
          api_key: API_KEY,
          render_js: "false",
        },
      });
      return response.data;
    } catch (error) {
      attempt++;
      console.error(
        `Error fetching data from ScrapingBee (attempt ${attempt}):`
      );
      await sleep(100);
      if (isAxiosError(error)) {
        console.log(error.response?.status);
        console.log(error.response?.data);
      } else if (error instanceof Error) {
        console.log(error.message);
      }
    }
  }

  await saveData(url, "data/badUrls.json");
  return "";
  // throw new ScrapingBeeError("Max retries reached");
};

export const fetchPageContentProxy = async (url: string): Promise<string> => {
  // const content = await readJSON('data/content.json')
  // if (Object.keys(content).includes(url)) {
  //   return content[url]
  // }
  const agent = new https.Agent({
    rejectUnauthorized: false,
  });

  const cookies = await loadAmazonCookies();
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const response = await axios.get(url, {
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
    } catch (error) {
      attempt++;
      console.error(
        `Error fetching data from ScrapingBee (attempt ${attempt}):`
      );
      await sleep(100);
      if (attempt >= maxRetries) {
        throw error;
      }
    }
  }

  throw new Error("Max retries reached");
};
