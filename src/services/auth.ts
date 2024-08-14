import { getRefreshInfo, writeJSON } from "../utils/jsonHelper";
import { BASE_URL } from "./config";
import axios from "axios";

export const refreshAccessToken = async () => {
  const url = `${BASE_URL}/auth/renew_token`;

  const { client_id, client_secret, refresh_token } = await getRefreshInfo();
  const response = await axios.get(url, {
    params: {
      client_id,
      client_secret,
      refresh: refresh_token,
    },
  });

  if (response.status === 200) {
    const { refresh_token: refresh_code, access_token } = response.data;
    await writeJSON("data/config.json", { client_id, client_secret, refresh_token: refresh_code, access_token });
    return access_token;
  } else {
    console.log(`Error obteniendo token de acceso: ${response.data}`);
    return null;
  }
};
