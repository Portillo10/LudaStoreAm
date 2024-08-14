import axios from "axios";

export const updatePrice = async (
  itemId: string,
  newPrice: number,
  access_token: string
) => {
  const url = `https://api.mercadolibre.com/items/${itemId}`;
  const headers = {
    Authorization: `Bearer ${access_token}`,
  };
  const response = await axios.put(url, { price: newPrice }, { headers });
};
