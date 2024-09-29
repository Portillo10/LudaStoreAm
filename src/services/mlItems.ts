import axios, { isAxiosError } from "axios";
import { sleep } from "../utils/helpers";
import { getDatabase } from "../db/database";
import { input } from "../utils/inputHelper";

const endpoint = "https://api.mercadolibre.com";

export const getItemsByScrollId = async (
  scrollId: string | null,
  access_token: string,
  user_id: string
): Promise<{ results: string[] | null; scroll_id: string }> => {
  const url = `${endpoint}/users/${user_id}/items/search?status=active&search_type=scan&limit=100${
    scrollId ? `&scroll_id=${scrollId}` : ""
  }`;

  try {
    const respose = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });
    if (respose.status === 200) {
      const { data } = respose;
      return { results: data.results, scroll_id: data.scroll_id };
    }
  } catch (error) {
    if (isAxiosError(error)) {
      console.log(error.response?.data);
      throw new Error(error.response?.data);
    }
    throw error;
  }

  return { results: null, scroll_id: "" };
};

export const getItemsByItemId = async (
  itemIds: string[],
  access_token: string
): Promise<{attributes:any[], id:string, status:string}[]> => {
  const idList = itemIds.filter((id) => id != null);
  const url = `${endpoint}/items?ids=${idList.join(
    ","
  )}&attributes=id,attributes`;
  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });
    if (response.status == 200) {
      const { data } = response;
      const result: any[] = data.map((item: any) => item.body);
      return result;
    } else {
      return [];
    }
  } catch (error) {
    if (isAxiosError(error)) {
      console.log(error.response?.data);
    }
    return [];
  }
};

export const pasePostByItemId = async (item_id: string, access_token: string) => {
  const url = `${endpoint}/items/${item_id}`;

  const data = {
    status: "paused",
  };

  try {
    const response = await axios.put(url, data, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });
    // console.log("producto cerrado con éxito");
  } catch (error) {
    if (isAxiosError(error)) {
      console.log(`Error cerrando producto ${error.response?.data}`);
    }
  }
  await sleep(500);
};

export const deleteItemById = async (item_id: string, access_token: string) => {
  const url = `${endpoint}/items/${item_id}`;

  const closedData = {
    status: "closed",
  };

  const deletedData = {
    deleted: "true",
  };

  try {
    const response = await axios.put(url, closedData, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });
    // console.log("producto cerrado con éxito");
  } catch (error) {
    if (isAxiosError(error)) {
      console.log(`Error cerrando producto ${error.response?.data}`);
    }
  }
  await sleep(1000);
  try {
    const response = axios.put(url, deletedData, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });
    console.log("producto eliminado con éxito");
  } catch (error) {
    if (isAxiosError(error)) {
      console.log(`Error eliminando producto ${error.response?.data}`);
    }
  }
  await sleep(500);
};

export const updateCondition = async (
  condition: string,
  item_id: string,
  access_token: string
) => {
  const url = `${endpoint}/items/${item_id}`;
  const data = {
    condition,
    sale_terms: [
      {
        id: "MANUFACTURING_TIME",
        value_name: "25 días",
      },
      {
        id: "WARRANTY_TYPE",
        value_name: "Garantía del vendedor",
      },
      {
        id: "WARRANTY_TIME",
        value_name: "30 días",
      },
    ],
  };

  const headers = {
    Authorization: `Bearer ${access_token}`,
  };
  try {
    const response = await axios.put(url, data, { headers });
    console.log(response.data.id);
  } catch (error) {
    if (isAxiosError(error)) {
      console.log(error.response?.data);
    }
  }
};

export const getAllItemIds = async (token: string, user_id: string) => {
  let scrollId = null;
  let currentResults: any | null = [];

  const idList = [];

  try {
    while (currentResults) {
      const { results, scroll_id } = await getItemsByScrollId(
        scrollId,
        token,
        user_id
      );
      if (scroll_id) {
        currentResults = results;
        scrollId = scroll_id;
        console.log(scroll_id);
      } else {
        currentResults = null;
        // await input("press any key, scroll null");
        break;
      }

      if (results) {
        idList.push(...results);
      }
      await sleep(100);
    }
    return idList;
  } catch (error) {
    console.log(error);
    return [];
  }
};

export const pausePost = async (token: string, itemId: string) => {
  const url = `${endpoint}/items/${itemId}`;

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  try {
    const response = await axios.put(
      url,
      { available_quantity: 0 },
      { headers }
    );

    console.log(response.data);
  } catch (error) {
    if (isAxiosError(error)) {
      console.log(error.response?.data);
    }
  }
};

export const updatePrice = async (
  token: string,
  itemId: string,
  newPrice: number
) => {
  const url = `${endpoint}/items/${itemId}`;

  const data = {
    price: newPrice,
  };
  const headers = {
    Authorization: `Bearer ${token}`,
  };
  try {
    const response = await axios.put(url, data, { headers });

  } catch (error) {
    if (isAxiosError(error)) {
      console.log(error.response?.data);
    }
    throw error;
  }
};

export const pausePub = async (item_id: string, access_token: string) => {
  const url = `${endpoint}/items/${item_id}`;

  const data = {
    status: "paused",
  };

  try {
    const response = await axios.put(url, data, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });
    console.log("Publicación pausado con éxito");
  } catch (error) {
    console.log(`Error pausando publicación`);
    if (isAxiosError(error)) {
      console.log(error.response?.data);
    } else {
      console.log(error);
    }
  }
};
