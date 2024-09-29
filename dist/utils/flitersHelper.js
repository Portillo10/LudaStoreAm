"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasForbbidenNumbers = exports.isAllowBrand = exports.cutText = exports.cleanText = exports.isForbiddenProduct = exports.isForbbidenWord = void 0;
const jsonHelper_1 = require("../utils/jsonHelper");
let filterList = null;
const firstLoad = async () => {
    if (!filterList) {
        filterList = await (0, jsonHelper_1.loadFilterList)();
    }
};
firstLoad();
function cleanWord(word) {
    const charsToRemove = ',-¿?[]:/()!¡#$%&"|;';
    const cleaned = Array.from(word)
        .filter((c) => !charsToRemove.includes(c))
        .join("")
        .toLowerCase()
        .trim();
    return cleaned;
}
const isForbbidenWord = (word) => {
    const lowerTitle = word.toLowerCase();
    const forbbidenWords = filterList["forbidden_words"];
    for (const forbbidenWord of forbbidenWords) {
        const regex = new RegExp(`(^|\\s)${forbbidenWord}(\\s|$)`);
        if (regex.test(lowerTitle)) {
            // console.log(`${title} - ${forbiddenProduct}`);
            return true;
        }
    }
    return false;
};
exports.isForbbidenWord = isForbbidenWord;
const isForbiddenProduct = (title) => {
    const lowerTitle = title.toLowerCase();
    const forbiddenProducts = filterList["forbidden_products"];
    for (const forbiddenProduct of forbiddenProducts) {
        const regex = new RegExp(`(^|\\s)${forbiddenProduct}(\\s|$)`);
        if (regex.test(lowerTitle)) {
            // console.log(`${title} - ${forbiddenProduct}`);
            return true;
        }
    }
    return false;
};
exports.isForbiddenProduct = isForbiddenProduct;
const cleanText = (text) => {
    let finalText = "";
    const forbiddenWords = filterList["forbidden_words"];
    const regexPattern = "\\b(" + forbiddenWords.join("|") + ")\\b[\\s.,!?\"'\\-]|\\d{4,}";
    const regex = new RegExp(regexPattern, "gi");
    finalText = text
        .replace(regex, "")
        .replace(/\s{2,}/g, " ")
        .trim();
    return finalText;
};
exports.cleanText = cleanText;
const cutText = (text, maxLength) => {
    if (text.length <= maxLength) {
        return text.trim();
    }
    let shortText = text.slice(0, maxLength);
    const lastIndex = shortText.length - 1;
    if (lastIndex < text.length &&
        text[lastIndex] !== " " &&
        text[lastIndex + 1] !== " ") {
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
exports.cutText = cutText;
const isAllowBrand = (title) => {
    const allowBrands = filterList["allow_brands"];
    for (const brand of Object.keys(allowBrands)) {
        if (title.toLowerCase().includes(brand)) {
            return allowBrands[brand];
        }
    }
    return false;
};
exports.isAllowBrand = isAllowBrand;
const hasForbbidenNumbers = (text) => {
    const regex = /\d{4,}/;
    return regex.test(text);
};
exports.hasForbbidenNumbers = hasForbbidenNumbers;
