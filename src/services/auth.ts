import { getStoreByAlias, refreshStoreToken } from "../db/models/store";
import { getRefreshInfo, writeJSON } from "../utils/jsonHelper";
import { BASE_URL } from "./config";
import axios from "axios";

export const refreshAccessToken = async (storeAlias: string) => {
  const url = `${BASE_URL}/auth/renew_token`;

  const store = await getStoreByAlias(storeAlias);

  if (!store) throw new Error("No se encontró tienda con ese alias");

  const response = await axios.get(url, {
    params: {
      client_id: store.client_id,
      client_secret: store.client_secret,
      refresh: store.refresh_token,
    },
  });

  if (response.status === 200) {
    const { refresh_token, access_token } = response.data;
    await refreshStoreToken(storeAlias, refresh_token)
    return access_token;
  } else {
    console.log(`Error obteniendo token de acceso: ${response.data}`);
    return null;
  }
};
