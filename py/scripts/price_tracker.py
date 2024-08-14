import traceback
import time
import random
import requests
import os
import sys
from requests import Response
from bs4 import BeautifulSoup as bs
from playwright.sync_api import sync_playwright, Browser, Page, Locator
from playwright_stealth import stealth_sync
from dotenv import load_dotenv
load_dotenv()


sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from utils.scrapingBeeClient import send_request
from services.put_price import put_price, pause_post
from services.forex import get_usd_cop_rate
from models.item import get_items, get_item_by_sku, update_price
from db.database import connect_db
from services.auth import refresh_token
from utils.helpers import get_json_content, get_random_user_agent, get_amazon_cookies, convert_to_price

def getPrice(soup):
    selectors = [
        '#corePriceDisplay_desktop_feature_div span.a-price.aok-align-center.reinventPricePriceToPayMargin.priceToPay',
        '#corePrice_desktop span.a-offscreen',
        '#corePrice_feature_div span.a-offscreen',
        '#corePriceDisplay_desktop_feature_div span.aok-offscreen'
    ]

    price_number = 0

    for selector in selectors:
        price = soup.select_one(selector)
        if price:
            price_number = price.text.strip().split('$')[1]
            break

    return float(price_number)
    

def trackPriceBySku(sku):
    url = f"https://www.amazon.com/-/es/dp/{sku}"
    user_agent = get_random_user_agent()
    cookies = get_amazon_cookies()
    
    response: Response = requests.get(url, cookies=cookies, headers={
                                      "User-Agent": user_agent})
    if response.status_code == 200:
        soup = bs(response.text, "html.parser")
        price = getPrice(soup)
        if int(price) == 0:
            print(f"- {sku} - no disponible")
            return None
        else:
            return price


def trackPrices(items):
    cookies = get_amazon_cookies()
    for item in items:
        print(item)
        actual_price = trackPriceBySku(item["sku"], cookies)
        if item["price"] != actual_price:
            pass
        time.sleep(random.uniform(1, 3))


def trackPricesByUrl(baseUrl):
    currentUrl = baseUrl
    cookies = get_amazon_cookies()
    while currentUrl:
        content = send_request(currentUrl)
        if not content:
            raise Exception("Page not found")
        soup = bs(content, "html.parser")
        elements = soup.findAll('[data-component-type="s-search-result"]')

        for element in elements:
            sku = element.get('data-asin')

def get_next_page(page: Page):
    next_page = page.query_selector(
                    "a.s-pagination-item.s-pagination-next.s-pagination-button.s-pagination-separator")
    if next_page:
        url = f"https://www.amazon.com/{
            next_page.get_attribute('href')}"
        return url
    else:
        return None
    
def getPriceFromLocator(element: Locator, sku):
    price_element = element.locator(
        '[data-cy="price-recipe"]')
    price_text = price_element.text_content()
    if price_text:
        price = convert_to_price(price_text)
    else:
        print("Precio no visible, navegando hacia la página del producto", sku)
        price = trackPriceBySku(sku)
    
    return price

def trackPrices_v2(url):
    with sync_playwright() as playwright:
        browser: Browser = playwright.chromium.launch(headless=False)
        usd_rate = get_usd_cop_rate(browser)
        token = refresh_token()
        context = browser.new_context()
        stealth_sync(context)
        current_url = url
        while current_url:
            content = send_request(current_url)
            if not content: raise Exception("Error obteniendo contenido de la página")
            page = context.new_page()
            try:
                page.set_content(content, wait_until="domcontentloaded")
                elements = page.locator(
                    '[data-component-type="s-search-result"]')
                for element in elements.all():
                    sku = element.get_attribute('data-asin')
                    item = get_item_by_sku(sku)
                    if item:
                        price = getPriceFromLocator(element, sku)
                        if price and price != float(item["price"]):
                            print("el precio cambió")
                            status_ok = put_price(token, usd_rate, item, price)
                            if status_ok:
                                update_price(sku, price)
                                
                        elif not price:
                            pause_post(item["item_id"], token)

                current_url = get_next_page(page)

            except Exception as error:
                traceback.print_exc()
                # print(error)
                break
            finally:
                page.close()

        context.close()
        browser.close()
        print("exit")


connect_db()
# products = get_items()

# trackPrices(products)

baseUrl = "https://www.amazon.com/-/es/s?keywords=Cojines+y+Accesorios&i=garden&rh=n%3A1063262%2Cp_85%3A2470955011%2Cp_72%3A1248915011%2Cp_123%3A102517%7C1123522%7C161338%7C326033&dc&language=es&c=ts&qid=1713296055&rnid=85457740011&ts_id=1063262&ref=sr_nr_p_123_4&ds=v1%3AVwa4pHiPHzK8FDL78uzmS8RVqM6ZZnmnv%2Fpl6YwLEJo"

trackPrices_v2(baseUrl)
