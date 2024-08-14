import { promises as fs } from "fs";
import { join } from "path";

const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

/**
 * Lee un archivo JSON y lo parsea.
 * @param relativePath - La ruta relativa del archivo JSON.
 * @returns El contenido del archivo JSON como objeto.
 */
export const readJSON = async (relativePath: string): Promise<any> => {
  const filePath = join(__dirname, "../../", relativePath);
  if (!(await fileExists(filePath))) {
    return []
  }
  const data = await fs.readFile(filePath, "utf-8");
  return JSON.parse(data || '[]');
};

/**
 * Escribe un objeto en un archivo JSON.
 * @param relativePath - La ruta relativa del archivo JSON.
 * @param data - El objeto a escribir en el archivo JSON.
 */
export const writeJSON = async (
  relativePath: string,
  data: any
): Promise<void> => {
  const filePath = join(__dirname, "../../", relativePath);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
};

export const loadFilterList = async (): Promise<Array<any> | any> => {
  const filterList = await readJSON("data/words_filter.json");
  return filterList;
};

export const loadAmazonCookies = async (): Promise<string> => {
  let cookies: any[] = await readJSON("data/cookies.json");
  const amazonCookies = cookies.filter((cookie) =>
    cookie.domain.includes("amazon")
  );
  const cookiesString = amazonCookies
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join(";");

  return cookiesString;
};

export const saveData = async (data: any, relativePath: string) => {
  const currentData: any[] = await readJSON(relativePath)
  currentData.push(data)
  await writeJSON(relativePath, currentData)
};

export const getRefreshInfo = async () => {
  const info = await readJSON('data/config.json')
  if (!info || info.length === 0) throw new Error('No fue posible establecer la configuración inicial.')
  return info
}

export const getRandomUserAgent = async () => {
  const userAgents = await readJSON('data/user_agents.json')
  const randomIndex = Math.floor(Math.random() * userAgents.length);
  return userAgents[randomIndex]
}