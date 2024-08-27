import axios, { isAxiosError } from "axios";
import { sleep } from "../utils/helpers";
import { getDatabase } from "../db/database";
import { input } from "../utils/inputHelper";

const endpoint = "https://api.mercadolibre.com";

export const getItemsByScrollId = async (
  scrollId: string | null,
  access_token: string
): Promise<{ results: string[] | null; scroll_id: string }> => {
  const url = `${endpoint}/users/1242366457/items/search?search_type=scan&limit=100${
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
) => {
  const idList = itemIds.filter((id) => id != null);
  const url = `${endpoint}/items?ids=${idList.join(",")}&attributes=id,title,attributes,status`;
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
    }else{
      return []
    }
  } catch (error) {
    if (isAxiosError(error)) {
      console.log(error.response?.data);
    }
    return [];
  }
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
    console.log("producto cerrado con éxito");
  } catch (error) {
    if (isAxiosError(error)) {
      console.log(`Error cerrando producto ${error.response?.data}`);
    }
  }
  await sleep(2000);
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
  // await sleep(1000);
};
