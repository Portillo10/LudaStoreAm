"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshAccessToken = void 0;
const store_1 = require("../db/models/store");
const config_1 = require("./config");
const axios_1 = __importDefault(require("axios"));
const refreshAccessToken = async (storeAlias) => {
    const url = `${config_1.BASE_URL}/auth/renew_token`;
    const store = await (0, store_1.getStoreByAlias)(storeAlias);
    if (!store)
        throw new Error("No se encontró tienda con ese alias");
    const response = await axios_1.default.get(url, {
        params: {
            client_id: store.client_id,
            client_secret: store.client_secret,
            refresh: store.refresh_token,
        },
    });
    if (response.status === 200) {
        const { refresh_token, access_token } = response.data;
        await (0, store_1.refreshStoreToken)(storeAlias, refresh_token);
        return access_token;
    }
    else {
        console.log(`Error obteniendo token de acceso: ${response.data}`);
        return null;
    }
};
exports.refreshAccessToken = refreshAccessToken;
