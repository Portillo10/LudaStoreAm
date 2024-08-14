from playwright.sync_api import Browser


def get_usd_cop_rate(browser: Browser):
    url = "https://finance.yahoo.com/quote/USDCOP=X"
    page = browser.new_page()
    for attemp in range(1, 4):
        try:
            page.goto(url, wait_until="domcontentloaded", timeout=10000)
            price = page.locator('fin-streamer.livePrice').first
            price_text = price.text_content()
            if price_text:
                page.close()
                return float(price_text.replace(",", ""))
            else:
                raise ValueError(
                    "Unable to find the USD to COP rate on Yahoo Finance")
        except:
            continue

    page.close()
