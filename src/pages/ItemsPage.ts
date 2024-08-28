import { BasePage } from "./BasePage";
import { ElementHandle } from "playwright";
import { isForbiddenProduct } from "../utils/flitersHelper";
import { extractSKUFromUrl } from "../utils/helpers";
import { getProductBySku } from "../db/models/product";
import { Task } from "../models/taskManager";

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
    const linksList = await this.openPage?.$$eval(
      itemSelector,
      (items): any[] => {
        const titleSelector = 'div[data-cy="title-recipe"]';
        const priceSelector = 'div[data-cy="price-recipe"] span.a-price';
        const allowItems = items.filter((item) => {
          const price = item.querySelector(priceSelector)?.textContent;
          if (!price) {
            console.log("Omitido - Producto no disponibe");
          }
          return price ? true : false;
        });

        return allowItems
          .map((item) => {
            const titleRecipe = item.querySelector(titleSelector);
            const sku = item.getAttribute("data-asin");
            const title = titleRecipe?.textContent;
            const link = titleRecipe?.querySelector("a")?.href;
            return { title, link, sku };
          })
          .filter(
            (item) =>
              item.title && item.link && item.link != "javascript:void(0)"
          );
      }
    );

    console.log(linksList?.length, "productos encontrados en la página");
    const result: string[] = [];
    if (!linksList) return [];

    let count = 0
    for (const item of linksList) {
      const sku = extractSKUFromUrl(item.link || "");
      const product = await getProductBySku(sku || "");
      if (product) {
        count++
      } else if (!isForbiddenProduct(item.title) && !result.includes(`https://www.amazon.com/-/es/dp/${item.sku}`)) {
        result.push(`https://www.amazon.com/-/es/dp/${item.sku}`);
      }
    }
    console.log(`${count} repetidos`);
    
    return result;
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
      if (productLinks.length >= 1500) {
        break;
      }
    }

    return productLinks;
  }

  async mapAllLinks2(task: Task): Promise<void> {
    while (task.currentUrl) {
      await this.navigateTo(task.currentUrl);
      let newLinks = await this.getLinks();
      const currentUrl = await this.getNextPageLink();
      task.loadLinks(newLinks);
      await task.setCurrentUrl(currentUrl)
      console.log(`${task.linkList.length} productos extraídos`);
      if (task.linkList.length >= 1500) {
        await task.setCurrentUrl(null)
        break;
      }
    }
  }
}
