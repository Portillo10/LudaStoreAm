"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePrice = void 0;
const axios_1 = __importDefault(require("axios"));
const updatePrice = async (itemId, newPrice, access_token) => {
    const url = `https://api.mercadolibre.com/items/${itemId}`;
    const headers = {
        Authorization: `Bearer ${access_token}`,
    };
    const response = await axios_1.default.put(url, { price: newPrice }, { headers });
};
exports.updatePrice = updatePrice;
