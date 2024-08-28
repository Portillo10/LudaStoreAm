"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.solveCaptcha = void 0;
const tesseract_js_1 = __importDefault(require("tesseract.js"));
const solveCaptcha = async (image) => {
    try {
        const result = await tesseract_js_1.default.recognize(image, "eng", {
            logger: (m) => console.log(m.status),
        });
        return result.data.text.trim();
    }
    catch (error) {
        console.error("Error al procesar el captcha:", error);
        throw new Error("No se pudo resolver el captcha");
    }
};
exports.solveCaptcha = solveCaptcha;
