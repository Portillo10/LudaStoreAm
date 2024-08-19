import { Page, BrowserContext, ElementHandle, Locator } from "playwright";
import { fetchPageContent, fetchPageContentProxy } from "../utils/scrapingBeeClient";
import { ProductDetails } from "../types/index";
import { Cheerio } from '../models/CheerioModel'

export abstract class BasePage {
  readonly context: BrowserContext;
  openPage: Page | null;
  currentUrl: string | null;
  currentContent: string | null;
  cheerio: Cheerio | null;

  constructor(context: BrowserContext) {
    this.context = context;
    this.openPage = null;
    this.currentUrl = null;
    this.currentContent = null;
    this.cheerio = null
  }

  getContent() {
    return this.currentContent
  }

  async navigateTo(url: string) {
    if (this.openPage) {
      await this.openPage?.close();
    }

    this.currentContent = await fetchPageContent(url);

    if (this.currentContent) {
      this.cheerio = new Cheerio(this.currentContent)
      this.openPage = await this.context.newPage();
      await this.openPage.setContent(this.currentContent, {
        waitUntil: "domcontentloaded",
      });
      this.currentUrl = url;
    } else {
      console.log("Página no disponible");
      throw new Error(`Error navegando hacia la página`);
    }
  }

  // async navigateTo(url: string) {
  //   if (this.openPage) {
  //     await this.openPage?.close();
  //   }

  //   this.openPage = await this.context.newPage();
  //   await this.openPage.goto(url, {
  //     waitUntil: "domcontentloaded",
  //     timeout:40000
  //   });
  //   this.cheerio = new Cheerio(await this.openPage.content())
  //   this.currentUrl = url;
  // }

  async setContent(content: string, url: string) {
    if (!content) throw new Error("Missing content")
    if (this.openPage?.isClosed() || !this.openPage) {
      this.openPage = await this.context.newPage()
    }
    await this.openPage?.setContent(content);
    this.cheerio = new Cheerio(content)
    this.currentUrl = url
  }

  async descompose() {
    await this.openPage?.close();
    this.currentContent = "";
    this.currentUrl = "";
    this.cheerio = null
  }

  async selectOneLocator(possibleSelectors: string[]) {
    for (const selector of possibleSelectors) {
      const element = this.openPage?.locator(selector).first();
      if (element && (await element.count()) > 0) {
        return element;
      }
    }
    return null;
  }

  async selectOne(possibleSelectors: string[]) {
    for (const selector of possibleSelectors) {
      const element = await this.openPage?.$(selector);
      if (element) {
        return element;
      }
    }
    return null;
  }

  async selectAllLocators(possibleSelectors: string[]) {
    for (const selector of possibleSelectors) {
      const elements = this.openPage?.locator(selector);
      if (elements && (await elements?.count()) > 0) {
        return elements;
      }
    }

    return null;
  }

  async selectAll(possibleSelectors: string[]) {
    for (const selector of possibleSelectors) {
      const elements = await this.openPage?.$$(selector);
      if (elements && elements.length > 0) {
        return elements;
      }
    }

    return null;
  }

  async convertLocatorToDict(elements: Locator) {
    const result: ProductDetails = {};

    for (const element of await elements.all()) {
      const keyElement = element?.locator(":first-child").first();
      const valueElement = element.locator(":nth-child(2)").first();
      let keyText = await keyElement?.textContent();
      let valueText = await valueElement?.textContent();
      if (
        keyText?.toLowerCase().includes("amazon") ||
        keyText?.toLowerCase().includes("clientes") ||
        keyText?.toLowerCase().includes("garantía") ||
        valueText?.toLowerCase().includes("click aquí")
      )
        continue;
      if (keyText && valueText) {
        keyText = keyText
          .replace(":", "")
          .replace("\n", "")
          .replace("\u200f", "")
          .replace("\u200e", "")
          .trim();
        valueText = valueText
          .replace("\n", "")
          .replace("\u200f", "")
          .replace("\u200e", "")
          .trim();
        result[keyText] = valueText;
      }
    }

    return result;
  }

  async convertElementsToDict(elements: ElementHandle[]) {
    const result: ProductDetails = {};

    for (const element of elements) {
      const keyElement = await element.$(":first-child");
      const valueElement = await element.$(":nth-child(2)");
      let keyText = await keyElement?.textContent();
      let valueText = await valueElement?.textContent();
      if (
        keyText?.toLowerCase().includes("amazon") ||
        keyText?.toLowerCase().includes("clientes") ||
        keyText?.toLowerCase().includes("garantía") ||
        valueText?.toLowerCase().includes("click aquí")
      )
        continue;
      if (keyText && valueText) {
        keyText = keyText
          .replace(":", "")
          .replace("\n", "")
          .replace("\u200f", "")
          .replace("\u200e", "")
          .trim();
        valueText = valueText
          .replace("\n", "")
          .replace("\u200f", "")
          .replace("\u200e", "")
          .trim();
        result[keyText] = valueText;
      }
    }

    return result;
  }

  extractElementFromElement(element: HTMLElement, possibleSelectors: string[]) {
    for (const selector of possibleSelectors) {
      const extractedElement = element.querySelector(selector);
      if (extractedElement) {
        return extractedElement;
      }
    }
    return null;
  }
}
