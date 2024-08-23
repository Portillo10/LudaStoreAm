import requests
import json
from utils.helpers import get_json_content

endpoint = 'http://127.0.0.1:8000/products'


def put_price(access_token, usd_rate, item: dict, new_price):
    weight = item.get('weight', None)
    dimensions = item.get('dimensions', None)
    category_id = item.get('category_id')
    item_id = item.get('item_id', None)

    url = f"{endpoint}/update_price"

    data = {
        "price": new_price,
        "dimensions": dimensions,
        "category": category_id,
        "weight": weight,
        "usd_rate": usd_rate,
        "token": access_token,
        "item_id": item_id
    }
    
    response = requests.put(url, data=json.dumps(data))

    if response.status_code == 200:
        print("Precio actualizado con éxito")
        return True
    else:
        print(response.status_code)
        print("error al actualizar precio")
        return False

def pause_post(item_id, access_token):
    url = f"{endpoint}/close_post"
    
    response = requests.put(url=url, params={
        "item_id": item_id,
        "access_token": access_token
    })
    
    if response.status_code == 200:
        print("Publicación pausada")
        
    else:
        print("Error pausando la aplicación")
        