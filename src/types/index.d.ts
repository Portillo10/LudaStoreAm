export interface ScrapedItem {
  title: string;
  description: string;
  url: string;
}

export type Task<T> = () => Promise<T>;

export type ProductDetails = { [key: string]: string};

export type Attributes = { [key: string]: string | number | null}