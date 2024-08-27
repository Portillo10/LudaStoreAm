import { load } from "cheerio";
import { ProductDetails } from "../types";

export class Cheerio {
  private $;
  constructor(html: string) {
    this.$ = load(html);
  }

  selectOne(possibleSelectors: string[]) {
    for (const selector of possibleSelectors) {
      const element = this.$(selector).first();
      if (element.length > 0) {
        return element;
      }
    }
    return null;
  }

  selectAll(possibleSelectors: string[]) {
    for (const selector of possibleSelectors) {
      const elements = this.$(selector);
      if (elements.length > 0) {
        return elements;
      }
    }
    return null;
  }

  getTitle() {
    const title = this.selectOne(["#productTitle"]);
    if (title) {
      return title.text();
    } else {
      return null;
    }
  }

  getPrice() {
    const priceSelectors = [
      "#corePriceDisplay_desktop_feature_div span.a-price.aok-align-center.reinventPricePriceToPayMargin.priceToPay",
      "#corePrice_desktop span.a-offscreen",
      "#corePrice_feature_div span.a-offscreen",
      "#corePriceDisplay_desktop_feature_div span.aok-offscreen",
    ];

    const priceElement = this.selectOne(priceSelectors);

    if (priceElement) {
      const price = priceElement.text().trim().split("$")[1].replace(",", "");
      return parseFloat(price);
    } else {
      return null;
    }
  }

  getDescription() {
    const descriptionSelectors = [
      "#feature-bullets ul li",
      "ul span li span.a-list-item.a-size-base.a-color-base",
    ];

    const descriptionItems = this.selectAll(descriptionSelectors);
    const description: string[] = [];
    if (descriptionItems) {
      descriptionItems.each((i, element) => {
        if (element) {
          const line = this.$(element).text().trim();
          if (line) {
            description.push(line);
          }
        }
      });
    }

    return description.join("\n");
  }

  getDetails() {
    const detailSelectors = [
      {
        selector: "div.a-fixed-left-grid.product-facts-detail",
        keySelector: "div.a-col-left span.a-color-base",
        valueSelector: "div.a-col-right span.a-color-base",
      },
      {
        selector: "table tbody tr.a-spacing-small",
        keySelector: "td.a-span3 span",
        valueSelector: "td.a-span9 span",
      },
      {
        selector: "#twister div.a-row",
        keySelector: "label",
        valueSelector: "span",
      },
    ];

    const details: ProductDetails = {};
    for (const selector of detailSelectors) {
      const detailElements = this.$(selector.selector);
      if (detailElements.length > 0) {
        detailElements.each((i, element) => {
          const key = this.$(element).find(selector.keySelector).text();
          const value = this.$(element).find(selector.valueSelector).text();
          if (key && value) {
            details[key.trim()] = value.trim();
          }
        });
      }
    }

    return details;
  }

  getSpecs() {
    const specsSelectors = [
      "#technicalSpecifications_feature_div tr",
      "#productDetails_techSpec_section_1 tr",
      "#productDetails_detailBullets_sections1 tr",
      "#detailBullets_feature_div li span",
    ];

    const mainSelector = specsSelectors.join(", ");

    const specsElements = this.$(mainSelector);

    const specs: ProductDetails = {};
    if (specsElements.length > 0) {
      specsElements.each((i, el) => {
        const key = this.$(el).children().eq(0).text();
        const value = this.$(el).children().eq(1).text();
        if (
          !key?.toLowerCase().includes("amazon") &&
          !key?.toLowerCase().includes("clientes") &&
          !key?.toLowerCase().includes("garantía") &&
          !value?.toLowerCase().includes("click aquí") &&
          key &&
          value
        ) {
          const keyText = key
            .replace(":", "")
            .replace("\n", "")
            .replace("\u200f", "")
            .replace("\u200e", "")
            .trim();
          const valueText = value
            .replace("\n", "")
            .replace("\u200f", "")
            .replace("\u200e", "")
            .trim();

          specs[keyText] = valueText;
        }
      });
      return specs;
    } else {
      return null;
    }
  }

  getImgSources() {
    const imgs = this.$("div.imgTagWrapper img.a-dynamic-image");
    if (imgs.length > 0) {
      const imgSources: any[] = [];
      imgs.each((i, el) => {
        const src = this.$(el).attr("src");
        const mainSrc = src?.split("._AC_")[0];
        const newSrc = `${mainSrc}._AC_SL1200_.jpg`;
        if (newSrc) imgSources.push({ source: newSrc });
      });
      return imgSources;
    }
  }

  getPricesAndSku() {
    const selector = '[data-component-type="s-search-result"]';
    const elements = this.$(selector);
    const items: any[] = [];
    console.log(elements.length);

    elements.each((i, el) => {
      const element = this.$(el);
      const sku = element.attr("data-asin");

      const priceElement = element.find('[data-cy="price-recipe"]');
      if (sku) {
        const price = priceElement
          .text()
          .split("$")[1]
          ?.replace(",", "")
          .replace("US", "");
        if (price) {
          items.push({ sku, price: parseFloat(price) });
        }
      }
    });
    return items;
  }

  getNextPageLink() {
    const selector =
      "a.s-pagination-item.s-pagination-next.s-pagination-button.s-pagination-separator";
    const nextPageButton = this.$(selector).eq(0);
    const nextPageLink = nextPageButton.attr("href");
    return nextPageLink ? `https://www.amazon.com/${nextPageLink}` : null;
  }

  getItemCondition(): string {
    const conditionEnum: Record<string, string> = {
      Refurbished: "refurbished",
      Reacondicionado: "refurbished",
    };

    const selector = "#renewedSingleOfferCaption_feature_div";
    const condition = this.$(selector).text().split("-")[0].trim();

    if (conditionEnum.hasOwnProperty(condition)) {
      return conditionEnum[condition];
    } else {
      return "new";
    }
  }
}
