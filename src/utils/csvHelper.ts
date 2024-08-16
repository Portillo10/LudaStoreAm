import { parse } from 'csv-parse'
import fs from 'fs'
import { join } from "path";


type Link = {
    category: string,
    url: string
}

export const readCsv = <T>(csvFilePath: string): Promise<T[]> => {
    const filePath = join(__dirname, "../../", csvFilePath);

    const headers = ['category', 'url'];

    const fileContent = fs.readFileSync(filePath, { encoding: 'utf-8' });

    return new Promise((resolve, reject) => {
        parse(fileContent, {
            delimiter: ',',
            columns: headers,
        }, (error, result: T[]) => {
            if (error) {
                reject(error);
            }
            resolve(result)
        });

    })
}

export const readLinksFromCsv = async () => {
    return await readCsv<Link>('data/urls.csv')
}