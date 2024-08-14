import os
import json
import random

current_dir = os.path.dirname(os.path.abspath(__file__))


def get_json_content(file_name: str):
    try:
        file_path = os.path.join(current_dir, f'../../data/{file_name}')
        with open(file_path, 'r', encoding='utf-8') as file:
            data = json.load(file)
            return data
    except FileNotFoundError:
        return []
    except json.JSONDecodeError:
        return []

def load_user_agents_from_json(file_name):
    user_agents = get_json_content(file_name)
    return user_agents.get('user_agents', [])


def get_random_user_agent() -> str:
    user_agents = load_user_agents_from_json('user_agents.json')
    if user_agents:
        return random.choice(user_agents)
    else:
        return None
    
def get_amazon_cookies():
    cookies = get_json_content('cookies.json')
    parsed_cookies = {cookie["name"]: cookie["value"]
                      for cookie in cookies if "amazon" in cookie["domain"]}
    
    return parsed_cookies

def convert_to_price(priceText):
    price = priceText.split('$')[1].replace(
        ',', '').replace('US', '')
    if price:
        return float(price)
    else:
        return None