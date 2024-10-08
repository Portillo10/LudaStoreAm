import axios from "axios";
import { imageSize } from "image-size";
import { readJSON } from "./jsonHelper";

export const removeContactInfo = (text: string) => {
  const urlRegex = /(?:https?:\/\/|www\.)[^\s/$.?#].[^\s]*/gi;
  const socialMediaRegex = /@[a-zA-Z0-9_]{1,15}/g;
  const domainRegex =
    /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}\b/gi;

  let cleanedText = text.replace(urlRegex, "").replace(socialMediaRegex, "");

  cleanedText = cleanedText.replace(domainRegex, "");
  cleanedText = cleanedText.replace(".com", "").replace("wwww.", "");

  return cleanedText.trim();
};

export const hasContactInfo = (text: string): boolean => {
  const urlRegex =
    /((https?:\/\/)?(www\.)?[^\s]+(\.[a-z]{2,}))|(\b\w+\.[a-z]{2,}\b)/gi;
  const phoneRegex = /\b\+?[\d\s\-()]{7,}\b/g;
  const socialMediaRegex = /@[A-Za-z0-9_.]+/g;

  const contactPhrasesRegex =
    /\b(contáctanos|contáctame|contáctate con|síguenos|sígueme|visita nuestra página|puedes llamarnos|visítanos en|llámanos|llámame|envíanos un correo|escríbenos|ponte en contacto|agenda una llamada|consulta con nosotros|habla con nosotros|puedes enviarnos)\b/gi;

  const hasUrl = urlRegex.test(text);
  const hasPhone = phoneRegex.test(text);
  const hasSocialMedia = socialMediaRegex.test(text);
  const hasContactPhrases = contactPhrasesRegex.test(text);

  return hasUrl || hasSocialMedia || hasContactPhrases;
};

export async function allowImageSize(url: string): Promise<boolean> {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const dimensions = imageSize(response.data);
    if (
      dimensions.width &&
      dimensions.height &&
      dimensions.width >= 500 &&
      dimensions.height >= 500
    ) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error("Error al obtener la imagen:", error);
    return true;
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
  if (!url) {
    console.log(url);
    return null;
  }
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

export const cleanDescription = (description: string) => {
  const urlRegex =
    /(?:https?:\/\/)?(?:www\.)?[^\s\/]+\.[a-z]{2,}(?:\/[^\s]*)?/gi;
  const phoneRegex = /\b\+?[\d\s\-()]{7,}\b/g;
  const socialMediaRegex = /@[A-Za-z0-9_.]+/g;

  const contactPhrasesRegex =
    /\b(contáctanos|contáctame|contáctate con|síguenos|sígueme|visita nuestra página|puedes llamarnos|visítanos en|llámanos|llámame|envíanos un correo|escríbenos|ponte en contacto|agenda una llamada|consulta con nosotros|habla con nosotros|puedes enviarnos)\b/gi;

  const untouchedStart = description.slice(0, 689) + ")\n";
  let textToClean = description.slice(716, -1777);
  const untouchedEnd = description.slice(-1777);

  // console.log(untouchedEnd);

  const [attributesText, amazonDescription] =
    splitTextByDescription(textToClean);

  const cleanedText = amazonDescription
    .replace(urlRegex, "")
    .replace(phoneRegex, "")
    .replace(socialMediaRegex, "")
    .replace(contactPhrasesRegex, "")
    .trim();
  // .replace(/\s{2,}/g, " ")

  return (
    untouchedStart +
    "\n" +
    attributesText +
    "\n" +
    removeEmojis(cleanedText) +
    "\n\n" +
    untouchedEnd
  );
};

function splitTextByDescription(text: string): [string, string] {
  // Definir la frase de búsqueda
  const searchPhrase = "Descripción del producto";

  // Encontrar la posición de la frase en el texto
  const index = text.indexOf(searchPhrase);

  // Si la frase no se encuentra, devolver el texto completo en la primera parte y una cadena vacía en la segunda
  if (index === -1) {
    return [text, ""];
  }

  // Dividir el texto en dos partes
  const beforeDescription = text.substring(0, index);
  const afterDescription = text.substring(index + searchPhrase.length);

  // Retornar ambas partes en un array
  return [beforeDescription, afterDescription];
}

function trimAfterDescription(text: string): string {
  const searchPhrase = "Descripción del producto";
  const index = text.indexOf(searchPhrase);

  if (index === -1) {
    return text;
  }

  return text.substring(0, index + searchPhrase.length);
}

export function removeEmojis(text: string): string {
  const emojiRegex =
    /[^a-zA-Z0-9 .,!?@#$%^&*()_\-+=:;"'`~<>{}\[\]\\/|\n\ráéíóúÁÉÍÓÚñÑ]+/gu;

  return text.replace(emojiRegex, "");
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
    throw error;
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
  const numberPart = parts[0].replace(",", ".");
  const unitPart = parts[1].toLowerCase();

  const numberWeight = parseFloat(cleanWeight(numberPart));

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
      throw new Error(`Unidad de peso desconocida: ${unitPart}`);
  }

  const librasRedondeadas =
    libras > 1 ? Math.ceil(libras * 1.1) : Math.ceil(libras);

  return `${librasRedondeadas} lb`;
};

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const extractChairsNumber = (text: string): number | null => {
  const regex =
    /\b(?:sillas para|para|sillas|taburetes)\s+(\d+)|(\d+)\s+(?:sillas|taburetes)\b/gi;
  const match = regex.exec(text);
  if (match) {
    return match[1] ? parseInt(match[1], 10) : parseInt(match[2], 10);
  }
  return null;
};

export const extractDIN = (text: string): string | null => {
  const regex = /\d+ DIN/g;
  const matches = text.match(regex);
  return matches ? matches[0] : null;
};
