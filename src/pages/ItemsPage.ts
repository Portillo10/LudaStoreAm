import { BasePage } from "./BasePage";
import { ElementHandle } from "playwright";
import { isForbiddenProduct } from "../utils/flitersHelper";
import { input } from "../utils/inputHelper";
import { itemExistBySku } from "../db/models/Item";
import { extractSKUFromUrl } from "../utils/helpers";
import { writeJSON } from "../utils/jsonHelper";
import { insertLinks } from "../db/models/link";

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
    const linksList = await this.openPage?.$$eval(
      'div[data-cy="title-recipe"]',
      (items): any[] =>
        items
          .map((item) => {
            const title = item.textContent;
            const link = item.querySelector("a")?.href;
            return { title, link };
          })
          .filter((item) => item.title && item.link != "javascript:void(0)")
    );

    console.log("Total de productos: ", linksList?.length);

    return linksList
      ? linksList
          .filter((link) => {
            // const sku = extractSKUFromUrl(link.link);
            return (
              !isForbiddenProduct(link.title)
            );
          })
          .map((link) => `https://www.amazon.com${link.link}`)
      : [];
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
      if (productLinks.length >= 1000){
        break
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
