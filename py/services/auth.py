import requests
from utils.helpers import get_json_content

endpoint = 'http://127.0.0.1:8000/auth'


def refresh_token():
    config = get_json_content('config.json')
    client_secret = config["client_secret"]
    client_id = config["client_id"]
    refresh_code = config["refresh_token"]

    url = f"{endpoint}/renew_token?client_id={
        client_id}&client_secret={client_secret}&refresh={refresh_code}"

    response = requests.get(url)
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        print("Error obteniendo el token")
        return None
