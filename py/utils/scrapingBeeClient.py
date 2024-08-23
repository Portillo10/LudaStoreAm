from scrapingbee import ScrapingBeeClient
from utils.helpers import get_amazon_cookies
import os

scrape_key = os.getenv("SCRAPINGBEE_API_KEY")
client = ScrapingBeeClient(scrape_key)

if not scrape_key:
    raise Exception("Missing scrape key")

def send_request(url):
    cookies = get_amazon_cookies()
    if not cookies:
        print('sin galletas')
        return None

    for attempt in range(1, 4):
        response = client.get(
            url,
            cookies=cookies,
            params={
                'render_js': 'false',
            },
            headers={
                'Accept-Language': 'es-MX, es-ES;q=0.9, es-AR;q=0.8, es-CO;q=0.8, es;q=0.7',
            }
        )

        if response.status_code == 200:
            return response.text
        else:
            print(f'Intento #{attempt} fallido.')
    return None