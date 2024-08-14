import { Browser } from "playwright";
import yahooFinance from 'yahoo-finance2';

export const getUsdRate = async (browser: Browser) => {
  const url = "https://finance.yahoo.com/quote/USDCOP=X";
  const context = await browser.newContext();
  const page = await context.newPage();
  let attemp = 1;

  while (attemp < 4) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded" });
      const usdRate = await page.$eval(
        "fin-streamer.livePrice",
        (element) => {
          if (!element.textContent) throw new Error('Error extrayendo el precio del dolar')
          console.log('desde yahoo');
          
          return parseFloat(element.textContent?.replace(',', '.'))
        }
      );
      return usdRate
    } catch (error) {
      console.log(`Error obteniendo usd rate (attemp ${attemp}): ${error}`);
      continue
    } finally {
      attemp++
    }
  }
};


export async function getUsdToCopRate() {
  const originalConsoleLog = console.log;
  const originalConsoleInfo = console.info;
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;

  try {
    console.log = () => {};
    console.info = () => {};
    console.warn = () => {};
    console.error = () => {};

    const quote = await yahooFinance.quote('USDCOP=X');
    const usdToCopRate = quote.regularMarketPrice;
    console.log('desde yahoo-finance');
    
    return usdToCopRate;
  } catch (error) {
    console.error('Error fetching USD to COP rate:', error);
    throw error;
  } finally {
    console.log = originalConsoleLog;
    console.info = originalConsoleInfo;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
  }

}