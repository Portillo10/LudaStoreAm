"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculatePrice = exports.updatePrice = void 0;
const axios_1 = __importStar(require("axios"));
const updatePrice = async (item, token, usd_rate) => {
    const endpoint = "http://127.0.0.1:8000/products/update_price";
    const { weight, dimensions, category_id: category, item_id, price } = item;
    try {
        const response = await axios_1.default.put(endpoint, {
            weight,
            dimensions,
            category,
            item_id,
            price,
            token,
            usd_rate,
        });
        if (response.status == 200) {
            // console.log(response.data);
            console.log("Precio actualizado con éxito");
        }
    }
    catch (error) {
        if ((0, axios_1.isAxiosError)(error)) {
            console.log(error.response?.data);
            throw new Error(error.response?.data);
        }
        throw error;
    }
};
exports.updatePrice = updatePrice;
const calculatePrice = async (product, token, usd_rate) => {
    const url = `http://127.0.0.1:8000/products/calc_price`;
    const data = {
        price: product.price,
        weight: product.weight,
        dimensions: product.dimensions,
        token,
        category: product.category_id,
        usd_rate,
    };
    try {
        const response = await axios_1.default.post(url, data);
        return response.data;
    }
    catch {
        console.log("error obteniendo precio");
    }
};
exports.calculatePrice = calculatePrice;
