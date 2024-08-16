import axios from 'axios';
import { imageSize } from 'image-size';
import { readJSON } from './jsonHelper';

export async function allowImageSize(url: string): Promise<boolean> {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const dimensions = imageSize(response.data);
        if (dimensions.width && dimensions.height && dimensions.width > 500 && dimensions.height > 500 ) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
      console.error('Error al obtener la imagen:', error);
      return true
    }
}

export const formatCookies = (cookies: any[]) => {
  const cookie_str = cookies
    .filter((cookie) => (cookie.domain as string).includes("amazon"))
    .map((cookie) => `${cookie.name}=${cookie.value}`);
  return cookie_str.join(";");
};

export const extractSKUFromUrl = (url: string): string | null => {
  const pattern = /(?:\/|%2F)(F)?dp(?:\/|%2F)([A-Z0-9]+)/;
  const match = url.match(pattern);

  if (match) {
    return match[1] || match[2];
  } else {
    return null;
  }
};

export const extractWeightFromText = (text: string) => {
  const pattern =
    /(?<=\b(Peso del artículo|Peso del paquete|Peso del producto)\s+)(\d+(?:[\.,]\d+)?)\s*(lb|libras|onzas|Libras|Onzas|LB|Lb|Gramos|gramos|oz|Oz|OZ|Kilogramos|kilogramos)(?![\d\w])/;

  const match = text?.match(pattern);

  return match ? match[0] : null;
};

export function removeEmojis(text: string): string {
  const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F700}-\u{1F77F}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FAFF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;

  return text.replace(emojiRegex, '');
}

export const separateDimensionsAndWeight = (dimensions: string) => {
  try {
    const result: Record<string, string> = {};
  
    if (dimensions.includes(";")) {
      
      const [size, weight] = dimensions.trim().split(";");
      result["Dimensiones"] = dimensionsToCm(size.trim());
      result["Peso"] = weight.trim();
    } else {
      result["Dimensiones"] = dimensionsToCm(dimensions.trim());
    }
  
    return result;
  } catch (error) {
    console.log("Error formateando dimensiones");
    throw error
  }
};

export const dimensionsToCm = (inches: string) => {
  const dimensions = inches.split("x");

  let depth: string, width: string, height: string;

  if (inches.includes('"')) {
    depth = dimensions[0].split('"')[0].trim();
    width = dimensions[1].split('"')[0].trim();
    height = dimensions.length > 2 ? dimensions[2].split('"')[0].trim() : "1";
  } else {
    depth = dimensions[0].trim();
    width = dimensions[1].trim();
    height = dimensions.length > 2 ? dimensions[2].trim() : "1";
  }

  depth = depth.replace(",", ".").split(" ")[0];
  width = width.replace(",", ".").split(" ")[0];
  height = height.replace(",", ".").split(" ")[0];

  const cmDepth = Math.ceil(parseFloat(depth) * 2.54);
  const cmWidth = Math.ceil(parseFloat(width) * 2.54);
  const cmHeight = Math.ceil(parseFloat(height) * 2.54);

  return `${cmDepth}x${cmWidth}x${cmHeight}`;
};

const cleanWeight = (weight: string) => {
  return weight.replace(/[^\d.,]/g, "").trim();
};

export const weightToPounds = (weight: string, units: number) => {
  if (!weight) {
    return "";
  }

  const parts = weight.split(" ");
  const numberPart = parts[0].replace(',', '.');
  const unitPart = parts[1].toLowerCase();

  const numberWeight = parseFloat(cleanWeight(numberPart)) * units;

  let libras: number;

  switch (unitPart) {
    case "libras":
    case "lb":
      libras = numberWeight;
      break;
    case "onzas":
    case "oz":
      libras = numberWeight / 16;
      break;
    case "gramos":
    case "g":
      libras = numberWeight / 453.59237;
      break;
    case "kilogramos":
    case "kg":
      libras = numberWeight * 2.20462;
      break;
    default:
      throw new Error(`Unidad de peso desconocida: ${unitPart}`)
  }

  const librasRedondeadas = Math.ceil(libras * 1.1);

  return `${librasRedondeadas} lb`;
};

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const extractChairsNumber = (text: string): number | null => {
  const regex = /\b(?:sillas para|para|sillas|taburetes)\s+(\d+)|(\d+)\s+(?:sillas|taburetes)\b/gi;
  const match = regex.exec(text);
  if (match) {
    return match[1] ? parseInt(match[1], 10) : parseInt(match[2], 10);
  }
  return null;
};

