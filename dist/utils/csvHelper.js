"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readLinksFromCsv = exports.readCsv = void 0;
const csv_parse_1 = require("csv-parse");
const fs_1 = __importDefault(require("fs"));
const path_1 = require("path");
const readCsv = (csvFilePath) => {
    const filePath = (0, path_1.join)(__dirname, "../../", csvFilePath);
    const headers = ['weight', 'category', 'url'];
    const fileContent = fs_1.default.readFileSync(filePath, { encoding: 'utf-8' });
    return new Promise((resolve, reject) => {
        (0, csv_parse_1.parse)(fileContent, {
            delimiter: ',',
            columns: headers,
        }, (error, result) => {
            if (error) {
                reject(error);
            }
            resolve(result);
        });
    });
};
exports.readCsv = readCsv;
const readLinksFromCsv = async () => {
    return await (0, exports.readCsv)('data/urls.csv');
};
exports.readLinksFromCsv = readLinksFromCsv;
