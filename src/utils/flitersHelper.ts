import { loadFilterList } from "../utils/jsonHelper";
import { ProductDetails } from "../types/index";

let filterList: any = null;

const firstLoad = async () => {
  if (!filterList) {
    filterList = await loadFilterList();
  }
};

firstLoad();

function cleanWord(word: string) {
  const charsToRemove = ',-¿?[]:/()!¡#$%&"|;';

  const cleaned = Array.from(word)
    .filter((c) => !charsToRemove.includes(c))
    .join("")
    .toLowerCase()
    .trim();

  return cleaned;
}

export const isForbbidenWord = (word: string) => {
  const lowerTitle = word.toLowerCase();
  const forbbidenWords: any[] = filterList["forbidden_words"];

  for (const forbbidenWord of forbbidenWords) {
    const regex = new RegExp(`(^|\\s)${forbbidenWord}(\\s|$)`);

    if (regex.test(lowerTitle)) {
      // console.log(`${title} - ${forbiddenProduct}`);
      return true;
    }
  }

  return false;
};

export const isForbiddenProduct = (title: string) => {
  const lowerTitle = title.toLowerCase();
  const forbiddenProducts: any[] = filterList["forbidden_products"];

  for (const forbiddenProduct of forbiddenProducts) {
    const regex = new RegExp(`(^|\\s)${forbiddenProduct}(\\s|$)`);

    if (regex.test(lowerTitle)) {
      // console.log(`${title} - ${forbiddenProduct}`);
      return true;
    }
  }

  return false;
};

export const cleanText = (text: string) => {
  let finalText: string = "";
  const forbiddenWords: string[] = filterList["forbidden_words"];

  const regexPattern =
    "\\b(" + forbiddenWords.join("|") + ")\\b[\\s.,!?\"'\\-]|\\d{4,}";
  const regex = new RegExp(regexPattern, "gi");

  finalText = text
    .replace(regex, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  return finalText;
};

export const cutText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) {
    return text.trim();
  }

  let shortText = text.slice(0, maxLength);

  const lastIndex = shortText.length - 1;

  if (
    lastIndex < text.length &&
    text[lastIndex] !== " " &&
    text[lastIndex + 1] !== " "
  ) {
    const lastSpaceIndex = shortText.lastIndexOf(" ");
    if (lastSpaceIndex === -1) {
      return "";
    }
    shortText = shortText.slice(0, lastSpaceIndex);
  }

  const excludedWords = [
    "con",
    "y",
    "a",
    "de",
    "gran",
    "o",
    "para",
    "la",
    "en",
    "una",
    "un",
    "que",
    ",",
  ];

  let words = shortText.trim().split(" ");

  while (words.length && excludedWords.includes(words[words.length - 1])) {
    words.pop();
  }

  return words.join(" ");
};

export const isAllowBrand = (title: string) => {
  const allowBrands: ProductDetails = filterList["allow_brands"];
  for (const brand of Object.keys(allowBrands)) {
    if (title.toLowerCase().includes(brand)) {
      return allowBrands[brand];
    }
  }
  return false;
};

export const hasForbbidenNumbers = (text: string) => {
  const regex = /\d{4,}/;
  return regex.test(text);
};
