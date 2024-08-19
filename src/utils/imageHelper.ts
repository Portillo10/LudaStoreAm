import fs from 'fs/promises';
import path from 'path';

/**
 * Elimina un archivo de imagen del sistema de archivos.
 * @param imagePath - Ruta al archivo de imagen que se desea eliminar.
 * @returns Promesa que se resuelve cuando el archivo ha sido eliminado.
 */
export const deleteImage = async(imagePath: string): Promise<void> => {
  try {
    // Verifica si el archivo existe antes de intentar eliminarlo
    await fs.access(imagePath);
    
    // Elimina el archivo
    await fs.unlink(imagePath);
    console.log(`Imagen eliminada: ${imagePath}`);
  } catch (err) {
    console.error(`Error al eliminar la imagen: ${err}`);
  }
}