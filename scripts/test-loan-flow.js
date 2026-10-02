const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const base = process.env.WEB_BASE_URL || 'http://127.0.0.1:3000';
const outDir = path.join(process.cwd(), '.artifacts', 'loan-flow');
fs.mkdirSync(outDir, { recursive: true });

async function shot(page, name) {
  const file = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`SCREENSHOT ${file}`);
}

async function clickText(page, text) {
  await page.getByText(text, { exact: false }).first().click({ timeout: 15000 });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    recordVideo: { dir: outDir, size: { width: 390, height: 844 } },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  page.setDefaultNavigationTimeout(60000);

  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('requestfailed', (req) => errors.push(`requestfailed: ${req.url()} ${req.failure()?.errorText}`));
  page.on('dialog', async (dialog) => {
    errors.push(`dialog: ${dialog.message()}`);
    await dialog.accept();
  });
  page.on('response', async (res) => {
    const url = res.url();
    if (url.includes('/api/')) {
      if (res.status() >= 400) {
        let body = '';
        try { body = await res.text(); } catch {}
        errors.push(`api ${res.status()}: ${url} ${body.slice(0, 500)}`);
      }
    }
  });

  const phone = `09${Date.now().toString().slice(-8)}`;
  await page.goto(`${base}/signup`, { waitUntil: 'commit', timeout: 60000 });
  await page.fill('input[placeholder="Số điện thoại"]', phone);
  await page.fill('input[placeholder="Mật khẩu"]', '123456');
  await page.fill('input[placeholder="Nhập lại mật khẩu"]', '123456');
  await shot(page, '01-signup-filled');
  await clickText(page, 'Đăng ký');
  await page.waitForURL('**/dashboard', { timeout: 20000 });
  await shot(page, '02-dashboard');

  await clickText(page, 'Đăng ký khoản vay');
  await page.waitForURL('**/choose-loan', { timeout: 20000 });
  await shot(page, '03-choose-loan');
  await page.locator('a[href^="/verify"]').first().click();
  await page.waitForURL('**/verify**', { timeout: 20000 });

  await page.fill('input[placeholder="Họ tên"]', 'Nguyen Van Test');
  await page.fill('input[placeholder="Số Hộ chiếu/CCCD"]', '012345678901');
  await page.locator('select').nth(0).selectOption('Nam');
  await page.fill('input[placeholder^="Sinh nhật"]', '01/01/1990');
  await page.fill('input[placeholder="Nghề nghiệp"]', 'Nhan vien');
  await page.locator('select').nth(1).selectOption('10 - 20 triệu');
  await page.locator('select').nth(2).selectOption('Tiêu dùng cá nhân');
  await page.fill('input[placeholder="Địa chỉ"]', 'Ha Noi');
  await page.fill('input[placeholder="Tên người thân"]', 'Nguyen Van A');
  await page.fill('input[placeholder="SĐT người thân"]', '0987654321');
  await page.locator('select').nth(3).selectOption('Anh/Chị/Em');
  await shot(page, '04-verify-filled');
  await clickText(page, 'Tiếp tục');
  await page.waitForURL('**/kyc', { timeout: 20000 });

  const sample = path.join(process.cwd(), 'kyc-sample.jpg');
  for (const id of ['front', 'back', 'face']) await page.setInputFiles(`#${id}`, sample);
  await shot(page, '05-kyc-filled');
  await clickText(page, 'Tiếp tục');
  await page.waitForURL('**/bank-info', { timeout: 20000 });

  await page.fill('input[placeholder="Số tài khoản"]', '123456789');
  await page.fill('input[placeholder="Tên chủ tài khoản"]', 'NGUYEN VAN TEST');
  await page.getByRole('button', { name: /KEB Hana Bank/ }).last().click();
  await shot(page, '06-bank-filled');
  await clickText(page, 'Gửi yêu cầu');
  await page.waitForURL('**/confirm-loan', { timeout: 20000 });

  const canvas = page.locator('canvas').first();
  const box = await canvas.boundingBox();
  if (!box) throw new Error('signature canvas missing');
  await page.mouse.move(box.x + 40, box.y + 80);
  await page.mouse.down();
  await page.mouse.move(box.x + 120, box.y + 130);
  await page.mouse.move(box.x + 220, box.y + 60);
  await page.mouse.up();
  await shot(page, '07-confirm-signed');
  await page.getByRole('button', { name: 'Hoàn tất' }).click({ force: true });
  try {
    await page.waitForURL('**/loan-success', { timeout: 25000 });
  } catch (error) {
    await shot(page, '08-submit-failed');
    throw new Error(`loan submit did not reach success. Errors: ${errors.join(' | ')}`);
  }
  await shot(page, '08-loan-success');

  await context.close();
  await browser.close();

  const videos = fs.readdirSync(outDir).filter((x) => x.endsWith('.webm')).map((x) => path.join(outDir, x));
  console.log(`PHONE ${phone}`);
  videos.forEach((v) => console.log(`VIDEO ${v}`));
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exitCode = 2;
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
