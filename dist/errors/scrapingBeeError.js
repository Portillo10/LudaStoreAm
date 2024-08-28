"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScrapingBeeError = void 0;
class ScrapingBeeError extends Error {
    constructor(message) {
        super(message);
        this.name = "NotFoundError";
        Object.setPrototypeOf(this, ScrapingBeeError.prototype);
    }
}
exports.ScrapingBeeError = ScrapingBeeError;
