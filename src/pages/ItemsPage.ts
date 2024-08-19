import { BasePage } from "./BasePage";
import { ElementHandle } from "playwright";
import { isForbiddenProduct } from "../utils/flitersHelper";
import { input } from "../utils/inputHelper";
import { itemExistBySku } from "../db/models/Item";
import { extractSKUFromUrl } from "../utils/helpers";
import { writeJSON } from "../utils/jsonHelper";
import { insertLinks } from "../db/models/link";
import { getProductBySku } from "../db/models/product";

export class ItemsPage extends BasePage {
  async getNextPageLink(): Promise<string | null> {
    const nextButtonSelector =
      "a.s-pagination-item.s-pagination-next.s-pagination-button.s-pagination-separator";

    const nextPageButton: ElementHandle | null | undefined =
      await this.openPage?.$(nextButtonSelector);

    const nextPageLink = await nextPageButton?.getAttribute("href");

    return nextPageLink ? `https://www.amazon.com/${nextPageLink}` : null;
  }

  async getLinks(): Promise<string[]> {
    const itemSelector = 'div[data-component-type="s-search-result"]';
    const titleSelector = 'div[data-cy="title-recipe"]';
    const priceSelctor = 'div[data-cy="price-recipe"] span.a-price';
    const linksList = await this.openPage?.$$eval(
      itemSelector,
      (items): any[] => {
        const allowItems = items.filter((item) => {
          const price = item.querySelector(priceSelctor)?.textContent
          if(!price){
            console.log('Omitido - Producto no disponibe');
          }
          return price ? true : false
        });

        return allowItems
          .map((item) => {
            const titleRecipe = item.querySelector(titleSelector);
            const title = titleRecipe?.textContent;
            const link = titleRecipe?.querySelector("a")?.href;
            return { title, link };
          })
          .filter(
            (item) =>
              item.title && item.link && item.link != "javascript:void(0)"
          );
      }
    );

    console.log("Total de productos: ", linksList?.length);
    const result: string[] = [];
    if (!linksList) return [];

    let duplicatedCount = 0;
    for (const item of linksList) {
      const sku = extractSKUFromUrl(item.link || "");
      const product = await getProductBySku(sku || "");
      if (product) {
        duplicatedCount++;
        // console.log('duplicado');
      } else if (!isForbiddenProduct(item.title)) {
        result.push(`https://www.amazon.com${item.link}`);
      }
    }
    console.log(`${duplicatedCount} productos duplicados`);

    return result;

    // return linksList
    //   ? (await Promise.all(linksList
    //     .filter(async (link) => {
    //       const sku = extractSKUFromUrl(link.link || '');
    //       const product = await getProductBySku(sku || '')
    //       if (product) {
    //         console.log('duplicado');
    //         return false;
    //       }
    //       return (

    //       );
    //     })))
    //     .map((link) => `https://www.amazon.com${link.link}`)
    //   : [];
  }

  async mapAllLinks(baseUrl: string): Promise<string[]> {
    let nextUrl: string | null = baseUrl;
    const productLinks = [];
    while (nextUrl) {
      await this.navigateTo(nextUrl);
      let newLinks = await this.getLinks();
      productLinks.push(...newLinks);
      nextUrl = await this.getNextPageLink();
      console.log(`${productLinks.length} productos extraídos`);
      if (productLinks.length >= 1000) {
        break;
      }
      // if (nextUrl) {
      //   const rt = await input("¿Desea continuar extrayendo links?: ");
      //   if (rt == "s") {
      //     continue;
      //   }
      //   break;
      // }
    }

    // productLinks.length = 16
    return productLinks;
  }
}
