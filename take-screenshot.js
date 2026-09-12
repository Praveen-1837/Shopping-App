import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  await page.goto('http://localhost:5173/farmer-centre', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: '/home/praveenshinde/.gemini/antigravity/brain/2789f972-6955-4ed0-a037-288ab1a9c541/farmer_centre_banner_fixed.png', fullPage: true });

  await browser.close();
  console.log('Screenshot taken!');
})();
