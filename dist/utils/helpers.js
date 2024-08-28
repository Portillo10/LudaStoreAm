"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractDIN = exports.extractChairsNumber = exports.weightToPounds = exports.dimensionsToCm = exports.separateDimensionsAndWeight = exports.extractWeightFromText = exports.extractSKUFromUrl = exports.formatCookies = void 0;
exports.allowImageSize = allowImageSize;
exports.removeEmojis = removeEmojis;
exports.sleep = sleep;
const axios_1 = __importDefault(require("axios"));
const image_size_1 = require("image-size");
async function allowImageSize(url) {
    try {
        const response = await axios_1.default.get(url, { responseType: "arraybuffer" });
        const dimensions = (0, image_size_1.imageSize)(response.data);
        if (dimensions.width &&
            dimensions.height &&
            dimensions.width >= 500 &&
            dimensions.height >= 500) {
            return true;
        }
        else {
            return false;
        }
    }
    catch (error) {
        console.error("Error al obtener la imagen:", error);
        return true;
    }
}
const formatCookies = (cookies) => {
    const cookie_str = cookies
        .filter((cookie) => cookie.domain.includes("amazon"))
        .map((cookie) => `${cookie.name}=${cookie.value}`);
    return cookie_str.join(";");
};
exports.formatCookies = formatCookies;
const extractSKUFromUrl = (url) => {
    const pattern = /(?:\/|%2F)(F)?dp(?:\/|%2F)([A-Z0-9]+)/;
    if (!url) {
        console.log(url);
        return null;
    }
    const match = url.match(pattern);
    if (match) {
        return match[1] || match[2];
    }
    else {
        return null;
    }
};
exports.extractSKUFromUrl = extractSKUFromUrl;
const extractWeightFromText = (text) => {
    const pattern = /(?<=\b(Peso del artículo|Peso del paquete|Peso del producto)\s+)(\d+(?:[\.,]\d+)?)\s*(lb|libras|onzas|Libras|Onzas|LB|Lb|Gramos|gramos|oz|Oz|OZ|Kilogramos|kilogramos)(?![\d\w])/;
    const match = text?.match(pattern);
    return match ? match[0] : null;
};
exports.extractWeightFromText = extractWeightFromText;
function removeEmojis(text) {
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F700}-\u{1F77F}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FAFF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{2300}-\u{23FF}]|[\u{2B50}]|[\u{1F004}-\u{1F0CF}]|[\u{1F1E6}-\u{1F1FF}]|[\u{2B06}]|[\u{2934}-\u{2935}]|[\u{3030}]|\u{2744}\u{FE0F}/gu;
    return text.replace(emojiRegex, "");
}
const separateDimensionsAndWeight = (dimensions) => {
    try {
        const result = {};
        if (dimensions.includes(";")) {
            const [size, weight] = dimensions.trim().split(";");
            result["Dimensiones"] = (0, exports.dimensionsToCm)(size.trim());
            result["Peso"] = weight.trim();
        }
        else {
            result["Dimensiones"] = (0, exports.dimensionsToCm)(dimensions.trim());
        }
        return result;
    }
    catch (error) {
        console.log("Error formateando dimensiones");
        throw error;
    }
};
exports.separateDimensionsAndWeight = separateDimensionsAndWeight;
const dimensionsToCm = (inches) => {
    const dimensions = inches.split("x");
    let depth, width, height;
    if (inches.includes('"')) {
        depth = dimensions[0].split('"')[0].trim();
        width = dimensions[1].split('"')[0].trim();
        height = dimensions.length > 2 ? dimensions[2].split('"')[0].trim() : "1";
    }
    else {
        depth = dimensions[0].trim();
        width = dimensions[1].trim();
        height = dimensions.length > 2 ? dimensions[2].trim() : "1";
    }
    depth = depth.replace(",", ".").split(" ")[0];
    width = width.replace(",", ".").split(" ")[0];
    height = height.replace(",", ".").split(" ")[0];
    const cmDepth = Math.ceil(parseFloat(depth) * 2.54);
    const cmWidth = Math.ceil(parseFloat(width) * 2.54);
    const cmHeight = Math.ceil(parseFloat(height) * 2.54);
    return `${cmDepth}x${cmWidth}x${cmHeight}`;
};
exports.dimensionsToCm = dimensionsToCm;
const cleanWeight = (weight) => {
    return weight.replace(/[^\d.,]/g, "").trim();
};
const weightToPounds = (weight, units) => {
    if (!weight) {
        return "";
    }
    const parts = weight.split(" ");
    const numberPart = parts[0].replace(",", ".");
    const unitPart = parts[1].toLowerCase();
    const numberWeight = parseFloat(cleanWeight(numberPart));
    let libras;
    switch (unitPart) {
        case "libras":
        case "lb":
            libras = numberWeight;
            break;
        case "onzas":
        case "oz":
            libras = numberWeight / 16;
            break;
        case "gramos":
        case "g":
            libras = numberWeight / 453.59237;
            break;
        case "kilogramos":
        case "kg":
            libras = numberWeight * 2.20462;
            break;
        default:
            throw new Error(`Unidad de peso desconocida: ${unitPart}`);
    }
    const librasRedondeadas = libras > 1 ? Math.ceil(libras * 1.1) : Math.ceil(libras);
    return `${librasRedondeadas} lb`;
};
exports.weightToPounds = weightToPounds;
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
const extractChairsNumber = (text) => {
    const regex = /\b(?:sillas para|para|sillas|taburetes)\s+(\d+)|(\d+)\s+(?:sillas|taburetes)\b/gi;
    const match = regex.exec(text);
    if (match) {
        return match[1] ? parseInt(match[1], 10) : parseInt(match[2], 10);
    }
    return null;
};
exports.extractChairsNumber = extractChairsNumber;
const extractDIN = (text) => {
    const regex = /\d+ DIN/g;
    const matches = text.match(regex);
    return matches ? matches[0] : null;
};
exports.extractDIN = extractDIN;
