import axios, { isAxiosError } from "axios";
import { WithId } from "mongodb";
import { ProductItem } from "../db/models/product";
import { input } from "../utils/inputHelper";

export const updatePrice = async (
  item: WithId<ProductItem>,
  token: string,
  usd_rate: number
) => {
  const endpoint = "http://127.0.0.1:8000/products/update_price";
  const { weight, dimensions, category_id: category, item_id, price } = item;
  try {
    const response = await axios.put(endpoint, {
      weight,
      dimensions,
      category,
      item_id,
      price,
      token,
      usd_rate,
    });
    if (response.status == 200) {
      // console.log(response.data);
      console.log("Precio actualizado con éxito");
    }
  } catch (error) {
    if (isAxiosError(error)) {
      console.log(error.response?.data);
      throw new Error(error.response?.data);
    }
    throw error;
  }
};

export const calculatePrice = async (
  product: WithId<ProductItem>,
  token: string,
  usd_rate: number
) => {
  const url = `http://127.0.0.1:8000/products/calc_price`;

  const data = {
    price: product.price,
    weight: product.weight,
    dimensions: product.dimensions,
    token,
    category: product.category_id,
    usd_rate,
  };
  try {
    const response = await axios.post(url, data);
    return response.data
  } catch {
    console.log("error obteniendo precio");
  }
};
