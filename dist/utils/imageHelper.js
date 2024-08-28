"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteImage = void 0;
const promises_1 = __importDefault(require("fs/promises"));
/**
 * Elimina un archivo de imagen del sistema de archivos.
 * @param imagePath - Ruta al archivo de imagen que se desea eliminar.
 * @returns Promesa que se resuelve cuando el archivo ha sido eliminado.
 */
const deleteImage = async (imagePath) => {
    try {
        // Verifica si el archivo existe antes de intentar eliminarlo
        await promises_1.default.access(imagePath);
        // Elimina el archivo
        await promises_1.default.unlink(imagePath);
        console.log(`Imagen eliminada: ${imagePath}`);
    }
    catch (err) {
        console.error(`Error al eliminar la imagen: ${err}`);
    }
};
exports.deleteImage = deleteImage;
