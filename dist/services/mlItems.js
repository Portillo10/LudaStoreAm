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
exports.pausePub = exports.updatePrice = exports.pausePost = exports.getAllItemIds = exports.updateCondition = exports.deleteItemById = exports.pasePostByItemId = exports.getItemsByItemId = exports.getItemsByScrollId = void 0;
const axios_1 = __importStar(require("axios"));
const helpers_1 = require("../utils/helpers");
const endpoint = "https://api.mercadolibre.com";
const getItemsByScrollId = async (scrollId, access_token, user_id) => {
    const url = `${endpoint}/users/${user_id}/items/search?status=active&search_type=scan&limit=100${scrollId ? `&scroll_id=${scrollId}` : ""}`;
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
    const url = `${endpoint}/items?ids=${idList.join(",")}&attributes=id,attributes`;
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
const pasePostByItemId = async (item_id, access_token) => {
    const url = `${endpoint}/items/${item_id}`;
    const data = {
        status: "paused",
    };
    try {
        const response = await axios_1.default.put(url, data, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });
        // console.log("producto cerrado con éxito");
    }
    catch (error) {
        if ((0, axios_1.isAxiosError)(error)) {
            console.log(`Error cerrando producto ${error.response?.data}`);
        }
    }
    await (0, helpers_1.sleep)(500);
};
exports.pasePostByItemId = pasePostByItemId;
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
        // console.log("producto cerrado con éxito");
    }
    catch (error) {
        if ((0, axios_1.isAxiosError)(error)) {
            console.log(`Error cerrando producto ${error.response?.data}`);
        }
    }
    await (0, helpers_1.sleep)(1000);
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
    await (0, helpers_1.sleep)(500);
};
exports.deleteItemById = deleteItemById;
const updateCondition = async (condition, item_id, access_token) => {
    const url = `${endpoint}/items/${item_id}`;
    const data = {
        condition,
        sale_terms: [
            {
                id: "MANUFACTURING_TIME",
                value_name: "25 días",
            },
            {
                id: "WARRANTY_TYPE",
                value_name: "Garantía del vendedor",
            },
            {
                id: "WARRANTY_TIME",
                value_name: "30 días",
            },
        ],
    };
    const headers = {
        Authorization: `Bearer ${access_token}`,
    };
    try {
        const response = await axios_1.default.put(url, data, { headers });
        console.log(response.data.id);
    }
    catch (error) {
        if ((0, axios_1.isAxiosError)(error)) {
            console.log(error.response?.data);
        }
    }
};
exports.updateCondition = updateCondition;
const getAllItemIds = async (token, user_id) => {
    let scrollId = null;
    let currentResults = [];
    const idList = [];
    try {
        while (currentResults) {
            const { results, scroll_id } = await (0, exports.getItemsByScrollId)(scrollId, token, user_id);
            if (scroll_id) {
                currentResults = results;
                scrollId = scroll_id;
                console.log(scroll_id);
            }
            else {
                currentResults = null;
                // await input("press any key, scroll null");
                break;
            }
            if (results) {
                idList.push(...results);
            }
            await (0, helpers_1.sleep)(100);
        }
        return idList;
    }
    catch (error) {
        console.log(error);
        return [];
    }
};
exports.getAllItemIds = getAllItemIds;
const pausePost = async (token, itemId) => {
    const url = `${endpoint}/items/${itemId}`;
    const headers = {
        Authorization: `Bearer ${token}`,
    };
    try {
        const response = await axios_1.default.put(url, { available_quantity: 0 }, { headers });
        console.log(response.data);
    }
    catch (error) {
        if ((0, axios_1.isAxiosError)(error)) {
            console.log(error.response?.data);
        }
    }
};
exports.pausePost = pausePost;
const updatePrice = async (token, itemId, newPrice) => {
    const url = `${endpoint}/items/${itemId}`;
    const data = {
        price: newPrice,
    };
    const headers = {
        Authorization: `Bearer ${token}`,
    };
    try {
        const response = await axios_1.default.put(url, data, { headers });
    }
    catch (error) {
        if ((0, axios_1.isAxiosError)(error)) {
            console.log(error.response?.data);
        }
        throw error;
    }
};
exports.updatePrice = updatePrice;
const pausePub = async (item_id, access_token) => {
    const url = `${endpoint}/items/${item_id}`;
    const data = {
        status: "paused",
    };
    try {
        const response = await axios_1.default.put(url, data, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });
        console.log("Publicación pausado con éxito");
    }
    catch (error) {
        console.log(`Error pausando publicación`);
        if ((0, axios_1.isAxiosError)(error)) {
            console.log(error.response?.data);
        }
        else {
            console.log(error);
        }
    }
};
exports.pausePub = pausePub;
