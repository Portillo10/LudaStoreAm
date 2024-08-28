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
exports.postProduct = void 0;
const config_1 = require("./config");
const axios_1 = __importStar(require("axios"));
const postProduct = async (product, token, usd_rate) => {
    const url = `${config_1.BASE_URL}/products`;
    const data = product.dumpsProduct();
    try {
        const response = await axios_1.default.post(url, data, {
            params: {
                token,
                usd_rate,
            },
        });
        if (response.status == 201) {
            return response.data;
        }
        else {
            console.log(response.data);
            throw new Error("Error publicando producto en MercadoLibre");
        }
    }
    catch (error) {
        // console.log(error);
        if (error instanceof axios_1.AxiosError) {
            console.log(error.message);
        }
        // console.log(data);
        throw error;
    }
};
exports.postProduct = postProduct;
