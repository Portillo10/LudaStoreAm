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
exports.deleteItemById = exports.getItemsByItemId = exports.getItemsByScrollId = void 0;
const axios_1 = __importStar(require("axios"));
const helpers_1 = require("../utils/helpers");
const endpoint = "https://api.mercadolibre.com";
const getItemsByScrollId = async (scrollId, access_token) => {
    const url = `${endpoint}/users/1242366457/items/search?search_type=scan&limit=100${scrollId ? `&scroll_id=${scrollId}` : ""}`;
    try {
        const respose = await axios_1.default.get(url, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });
        if (respose.status === 200) {
            const { data } = respose;
            return { results: data.results, scroll_id: data.scroll_id };
        }
    }
    catch (error) {
        if ((0, axios_1.isAxiosError)(error)) {
            console.log(error.response?.data);
            throw new Error(error.response?.data);
        }
        throw error;
    }
    return { results: null, scroll_id: "" };
};
exports.getItemsByScrollId = getItemsByScrollId;
const getItemsByItemId = async (itemIds, access_token) => {
    const idList = itemIds.filter((id) => id != null);
    const url = `${endpoint}/items?ids=${idList.join(",")}&attributes=id,title,attributes,status`;
    try {
        const response = await axios_1.default.get(url, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });
        if (response.status == 200) {
            const { data } = response;
            const result = data.map((item) => item.body);
            return result;
        }
        else {
            return [];
        }
    }
    catch (error) {
        if ((0, axios_1.isAxiosError)(error)) {
            console.log(error.response?.data);
        }
        return [];
    }
};
exports.getItemsByItemId = getItemsByItemId;
const deleteItemById = async (item_id, access_token) => {
    const url = `${endpoint}/items/${item_id}`;
    const closedData = {
        status: "closed",
    };
    const deletedData = {
        deleted: "true",
    };
    try {
        const response = await axios_1.default.put(url, closedData, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });
        console.log("producto cerrado con éxito");
    }
    catch (error) {
        if ((0, axios_1.isAxiosError)(error)) {
            console.log(`Error cerrando producto ${error.response?.data}`);
        }
    }
    await (0, helpers_1.sleep)(2000);
    try {
        const response = axios_1.default.put(url, deletedData, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });
        console.log("producto eliminado con éxito");
    }
    catch (error) {
        if ((0, axios_1.isAxiosError)(error)) {
            console.log(`Error eliminando producto ${error.response?.data}`);
        }
    }
    // await sleep(1000);
};
exports.deleteItemById = deleteItemById;
