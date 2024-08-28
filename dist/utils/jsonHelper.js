"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRandomUserAgent = exports.getRefreshInfo = exports.saveData = exports.loadAmazonCookies = exports.loadFilterList = exports.writeJSON = exports.readJSON = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const fileExists = async (filePath) => {
    try {
        await fs_1.promises.access(filePath);
        return true;
    }
    catch {
        return false;
    }
};
/**
 * Lee un archivo JSON y lo parsea.
 * @param relativePath - La ruta relativa del archivo JSON.
 * @returns El contenido del archivo JSON como objeto.
 */
const readJSON = async (relativePath) => {
    const filePath = (0, path_1.join)(__dirname, "../../", relativePath);
    if (!(await fileExists(filePath))) {
        return [];
    }
    const data = await fs_1.promises.readFile(filePath, "utf-8");
    return JSON.parse(data || '[]');
};
exports.readJSON = readJSON;
/**
 * Escribe un objeto en un archivo JSON.
 * @param relativePath - La ruta relativa del archivo JSON.
 * @param data - El objeto a escribir en el archivo JSON.
 */
const writeJSON = async (relativePath, data) => {
    const filePath = (0, path_1.join)(__dirname, "../../", relativePath);
    await fs_1.promises.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
};
exports.writeJSON = writeJSON;
const loadFilterList = async () => {
    const filterList = await (0, exports.readJSON)("data/words_filter.json");
    return filterList;
};
exports.loadFilterList = loadFilterList;
const loadAmazonCookies = async () => {
    let cookies = await (0, exports.readJSON)("data/cookies.json");
    const amazonCookies = cookies.filter((cookie) => cookie.domain.includes("amazon"));
    const cookiesString = amazonCookies
        .map((cookie) => `${cookie.name}=${cookie.value}`)
        .join(";");
    return cookiesString;
};
exports.loadAmazonCookies = loadAmazonCookies;
const saveData = async (data, relativePath) => {
    const currentData = await (0, exports.readJSON)(relativePath);
    currentData.push(data);
    await (0, exports.writeJSON)(relativePath, currentData);
};
exports.saveData = saveData;
const getRefreshInfo = async () => {
    const info = await (0, exports.readJSON)('data/config.json');
    if (!info || info.length === 0)
        throw new Error('No fue posible establecer la configuración inicial.');
    return info;
};
exports.getRefreshInfo = getRefreshInfo;
const getRandomUserAgent = async () => {
    const userAgents = await (0, exports.readJSON)('data/user_agents.json');
    const randomIndex = Math.floor(Math.random() * userAgents.length);
    return userAgents[randomIndex];
};
exports.getRandomUserAgent = getRandomUserAgent;
