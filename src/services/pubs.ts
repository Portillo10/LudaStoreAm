import { Product } from "../models/Product";
import { BASE_URL } from "./config";
import axios, { AxiosError } from "axios";

export const postProduct = async (
  product: Product,
  token: string,
  usd_rate: number
) => {
  const url = `${BASE_URL}/products`;

  const data = product.dumpsProduct();

  try {
    const response = await axios.post(url, data, {
      params: {
        token,
        usd_rate,
      },
    });

    if (response.status == 201) {
      return response.data;
    } else {
      console.log(response.data);
      throw new Error("Error publicando producto en MercadoLibre");
    }
  } catch (error) {
    console.log(error);
    if (error instanceof AxiosError) {
      console.log(error.message);    
    }
    // console.log(data);
    throw error
  }
};
