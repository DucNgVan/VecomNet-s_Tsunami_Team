import puppeteer from 'puppeteer-core';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('https://www.net-s.id.vn/admin', { waitUntil: 'networkidle2' });

  // Auto-fill and submit passkey
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const demoBtn = btns.find(b => b.innerText.includes('Nạp Khóa Demo') || b.innerText.includes('Khóa Demo'));
    if (demoBtn) demoBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const submitBtn = btns.find(b => b.innerText.includes('Xác Thực') || b.innerText.includes('Vào Bảng'));
    if (submitBtn) submitBtn.click();
  });
  await new Promise(r => setTimeout(r, 3000));

  // 1. Overview
  await page.screenshot({ path: 'demo_captures/08a_admin_overview.png' });
  console.log('Saved 08a_admin_overview.png');

  // Helper to click sidebar item
  async function clickNav(keyword) {
    return await page.evaluate((kw) => {
      const items = Array.from(document.querySelectorAll('button, a, div, span'));
      const found = items.find(el => el.innerText && el.innerText.trim().startsWith(kw));
      if (found) {
        found.click();
        return true;
      }
      return false;
    }, keyword);
  }

  // 2. Orders
  await clickNav('Đơn hàng');
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: 'demo_captures/08b_admin_orders.png' });
  console.log('Saved 08b_admin_orders.png');

  // 3. Supply Chain / Passport
  await clickNav('Lưới & Passport');
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: 'demo_captures/08c_admin_supply_chain.png' });
  console.log('Saved 08c_admin_supply_chain.png');

  // 4. Products & Charm
  await clickNav('Sản phẩm & charm');
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: 'demo_captures/08d_admin_products.png' });
  console.log('Saved 08d_admin_products.png');

  await browser.close();
  console.log('All detailed admin screenshots saved successfully!');
})();
