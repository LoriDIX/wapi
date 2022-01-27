import * as wppconnect from 'wppconnect';
import * as puppeteer from 'puppeteer';

wppconnect.defaultLogger.level = 'silly';

async function init() {
  const browser = await puppeteer.launch({
    headless: false,
  });

  const waitAllClose = [];

  for (let i = 0; i < 5; i++) {
    const context = await browser.createIncognitoBrowserContext();

    waitAllClose.push(
      new Promise((resolve) => {
        context.on('targetdestroyed', resolve);
      })
    );

    wppconnect
      .create({
        session: `session-${i}`,
        disableWelcome: true,
        logQR: false, // Logs QR automatically in terminal
        updatesLog: false, // Logs info updates automatically in terminal
        autoClose: 60000,
        browser: context,
      })
      .catch(() => {});

    // Delay
    await new Promise((resolve) => {
      setTimeout(resolve, 3000);
    });
  }

  await Promise.all(waitAllClose);
  browser.close();
}
init();
