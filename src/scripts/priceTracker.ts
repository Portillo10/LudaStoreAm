import { config } from "dotenv";
config();
import { connectToDatabase } from "../db/database";
import {
  countProducts,
  getPostedLinks,
  link,
  updatePostedLink,
} from "../db/models/postedLink";
import { fetchPageContent } from "../utils/scrapingBeeClient";
import { load } from "cheerio";
import { input } from "../utils/inputHelper";
import { getProduct, updateProduct } from "../db/models/product";
import { sleep } from "../utils/helpers";
import { runTasksVoid } from "../utils/taskExecutor";

const getPriceBySku = async (sku: string) => {
  const url = `https://www.amazon.com/-/es/dp/${sku}`;

  const content = await fetchPageContent(url);
  const $ = load(content);

  const selectors = [
    "#corePriceDisplay_desktop_feature_div span.a-price.aok-align-center.reinventPricePriceToPayMargin.priceToPay",
    "#corePrice_desktop span.a-offscreen",
    "#corePrice_feature_div span.a-offscreen",
    "#corePriceDisplay_desktop_feature_div span.aok-offscreen",
  ];

  const theSelector = selectors.join(", ");

  const priceElement = $(theSelector).eq(0);

  if (priceElement.length > 0) {
    const priceText = priceElement
      .text()
      .trim()
      .split("$")[1]
      .replace("US", "");
    return parseFloat(priceText);
  } else {
    return null;
  }
};

const scrapePage = (content: string) => {
  const $ = load(content);

  const itemElements = $('[data-component-type="s-search-result"]');

  const items: { sku: string; price: number | null }[] = [];

  itemElements.each((i, element) => {
    const sku = $(element).attr("data-asin");
    try {
      if (!sku) throw new Error("No se encontró sku para el elemento");
      const priceElement = $(element).find("[data-cy='price-recipe']");
      let price = null;
      if (
        priceElement.length > 0 &&
        priceElement.text().split("$").length > 1
      ) {
        const priceText = priceElement
          .text()
          .split("$")[1]
          .replace(",", "")
          .replace("US", "");
        price = parseFloat(priceText);
      }
      items.push({ sku, price });
    } catch (error) {
      console.log(error);
    }
  });

  const nextPageSelector =
    "a.s-pagination-item.s-pagination-next.s-pagination-button.s-pagination-separator";

  const nextPageElement = $(nextPageSelector);
  let nextUrl = null;

  if (nextPageElement.length > 0) {
    const href = nextPageElement.attr("href");
    nextUrl = `https://www.amazon.com/${href}`;
  }

  return { items, nextUrl };
};

const trackPrice = async (link: link) => {
  console.log(link.category_id);

  const limit = 1500;

  if (!link.link) throw new Error();
  let currentUrl: string | null = link.link;

  let emptyPages = 0;
  while (currentUrl) {
    if (link.skuList.length >= limit) {
      console.log("límite alcanzado");
      break;
    }

    const content = await fetchPageContent(currentUrl);
    const { items, nextUrl } = scrapePage(content);
    currentUrl = nextUrl;

    let itemsPerPage = 0;
    for (const item of items) {
      const product = await getProduct(
        { sku: item.sku },
        {
          projection: { pictures: 0, attributes: 0, description: 0 },
        }
      );
      if (product && !link.skuList.includes(item.sku)) {
        itemsPerPage++;
        link.skuList.push(item.sku);

        if (!item.price) {
          await updateProduct(
            { _id: product._id },
            { $set: { state: "unavailable" } }
          );
        } else if (item.price != product.price) {
          console.log(item.sku, item.price);

          await updateProduct(
            { _id: product._id },
            { $set: { state: "updated", price: item.price } }
          );
        }
      }
    }

    if (itemsPerPage == 0) {
      emptyPages++;
      //   console.log("no se encontraron items en esta página");
    } else {
      emptyPages = 0;
    }

    if (emptyPages >= 6) {
      break;
    }

    await sleep(50);
  }
  await updatePostedLink(
    { _id: link._id },
    { $set: { skuList: link.skuList, lastUpdate: new Date() } }
  );
};

(async () => {
  await connectToDatabase();

  // await countProducts()

  const postedLinks = await getPostedLinks({});
  console.log(postedLinks.length);

  await runTasksVoid<link, void>(postedLinks, trackPrice, 4);
})();
