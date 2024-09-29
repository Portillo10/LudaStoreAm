import { Attributes } from "../types";
import { cleanText, isForbiddenProduct } from "./flitersHelper";
import { hasContactInfo } from "./helpers";
import { readJSON } from "./jsonHelper";

export const calculateCheckDigit = (gtin: string): number => {
  let total = 0;

  for (let i = 0; i < gtin.length; i++) {
    const digit = parseInt(gtin[gtin.length - 1 - i], 10);
    if (i % 2 === 0) {
      total += digit * 3;
    } else {
      total += digit;
    }
  }

  return (10 - (total % 10)) % 10;
};

export const generateGtin13 = (): string => {
  const base = Array.from({ length: 12 }, () =>
    Math.floor(Math.random() * 10).toString()
  ).join("");
  const checkDigit = calculateCheckDigit(base);
  return base + checkDigit.toString();
};

export const generatePartNumber = (): string => {
  /**
   * Genera un número de parte aleatorio.
   *
   * @returns {string} Número de parte generado aleatoriamente.
   */
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let partNumber = "";

  for (let i = 0; i < 10; i++) {
    partNumber += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }

  return partNumber;
};

export const stealthAttributes = async (
  category_id: string,
  attributes: Attributes
) => {
  const categories = await readJSON("data/categories.json");
  const resultAttributes: Attributes = {};
  if (!attributes.hasOwnProperty("Marca")) {
    console.log("No tiene Marca");

    attributes["Marca"] = "Genérica";
  }

  if (!attributes.hasOwnProperty("Modelo")) {
    attributes["Modelo"] = generatePartNumber();
  }

  if (categories.hasOwnProperty(category_id)) {
    const { default_values, parsed_attributes } = categories[category_id];

    for (const [key, rightKey] of Object.entries(parsed_attributes)) {
      if (
        typeof rightKey === "string" &&
        attributes.hasOwnProperty(key) &&
        !attributes.hasOwnProperty(rightKey) &&
        !hasContactInfo(attributes[key]?.toString() || "")
      ) {
        let value = attributes[key];
        if (rightKey == "Potencia pico" && value) {
          value = value.toString().split(" ")[0] + " VA";
        }

        delete attributes[key];
        attributes[rightKey] = value;
      }
    }

    for (const [key, value] of Object.entries(default_values)) {
      if (!attributes.hasOwnProperty(key) && typeof value === "string") {
        attributes[key] = value;
      }
    }
  }

  for (const [key, value] of Object.entries(attributes)) {
    if (value && !hasContactInfo(value.toString())) {
      resultAttributes[key] = cleanText(value.toString());
    }
  }

  return resultAttributes;
};
