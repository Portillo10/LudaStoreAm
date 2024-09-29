"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stealthAttributes = exports.generatePartNumber = exports.generateGtin13 = exports.calculateCheckDigit = void 0;
const flitersHelper_1 = require("./flitersHelper");
const helpers_1 = require("./helpers");
const jsonHelper_1 = require("./jsonHelper");
const calculateCheckDigit = (gtin) => {
    let total = 0;
    for (let i = 0; i < gtin.length; i++) {
        const digit = parseInt(gtin[gtin.length - 1 - i], 10);
        if (i % 2 === 0) {
            total += digit * 3;
        }
        else {
            total += digit;
        }
    }
    return (10 - (total % 10)) % 10;
};
exports.calculateCheckDigit = calculateCheckDigit;
const generateGtin13 = () => {
    const base = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10).toString()).join("");
    const checkDigit = (0, exports.calculateCheckDigit)(base);
    return base + checkDigit.toString();
};
exports.generateGtin13 = generateGtin13;
const generatePartNumber = () => {
    /**
     * Genera un número de parte aleatorio.
     *
     * @returns {string} Número de parte generado aleatoriamente.
     */
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let partNumber = "";
    for (let i = 0; i < 10; i++) {
        partNumber += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return partNumber;
};
exports.generatePartNumber = generatePartNumber;
const stealthAttributes = async (category_id, attributes) => {
    const categories = await (0, jsonHelper_1.readJSON)("data/categories.json");
    const resultAttributes = {};
    if (!attributes.hasOwnProperty("Marca")) {
        console.log("No tiene Marca");
        attributes["Marca"] = "Genérica";
    }
    if (!attributes.hasOwnProperty("Modelo")) {
        attributes["Modelo"] = (0, exports.generatePartNumber)();
    }
    if (categories.hasOwnProperty(category_id)) {
        const { default_values, parsed_attributes } = categories[category_id];
        for (const [key, rightKey] of Object.entries(parsed_attributes)) {
            if (typeof rightKey === "string" &&
                attributes.hasOwnProperty(key) &&
                !attributes.hasOwnProperty(rightKey) &&
                !(0, helpers_1.hasContactInfo)(attributes[key]?.toString() || "")) {
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
        if (value && !(0, helpers_1.hasContactInfo)(value.toString())) {
            resultAttributes[key] = (0, flitersHelper_1.cleanText)(value.toString());
        }
    }
    return resultAttributes;
};
exports.stealthAttributes = stealthAttributes;
