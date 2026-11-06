const { chromium } = require('C:/Users/luvan/Learning/bestprice/.worktrees/feature-0048-issue-252-cadastro-self-service/frontend/node_modules/playwright');
const BASE = 'http://127.0.0.1:5148';
const SHOTS = process.argv[2];
const log = (...a) => console.log(...a);
async function fill(page, email, pw, conf) {
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha', { exact: true }).fill(pw);
  await page.getByLabel('Confirmar senha').fill(conf);
}
(async () => {
  const browser = await chromium.launch();
  // AC09 na UI (mobile 390): envia duplicados até a recusa por limite
  let ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  let page = await ctx.newPage();
  await page.goto(BASE + '/cadastro'); await page.getByRole('heading', { name: 'Criar sua conta' }).waitFor();
  await page.screenshot({ path: SHOTS + '/ac13-cadastro-390.png', fullPage: true });
  for (let i = 1; i <= 7; i++) {
    await fill(page, 'ana@exemplo.com', 'tentativa-senha-' + i + '-xx', 'tentativa-senha-' + i + '-xx');
    const resp = page.waitForResponse((r) => r.url().includes('/api/auth/signup') && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Criar conta' }).click();
    const r = await resp;
    log(`envio ${i}: HTTP ${r.status()} retry-after=${r.headers()['retry-after'] ?? '-'}`);
    if (r.status() === 429) {
      await page.getByRole('alert').waitFor();
      log('AC09 UI alerta =', await page.getByRole('alert').innerText());
      log('  e-mail preservado =', await page.getByLabel('E-mail').inputValue());
      await page.screenshot({ path: SHOTS + '/ac09-limite-390.png', fullPage: true });
      break;
    }
  }
  await ctx.close();

  // Falha de rede no POST (simulada no navegador: o pedido não chega ao servidor)
  ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  page = await ctx.newPage();
  await page.route('**/api/auth/signup', (route) => route.request().method() === 'POST' ? route.abort('internetdisconnected') : route.continue());
  await page.goto(BASE + '/cadastro'); await page.getByRole('heading', { name: 'Criar sua conta' }).waitFor();
  await fill(page, 'rede@exemplo.com', 'senha-de-rede-12345', 'senha-de-rede-12345');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await page.getByRole('alert').waitFor();
  log('REDE POST abortado: alerta =', await page.getByRole('alert').innerText(), '| e-mail =', await page.getByLabel('E-mail').inputValue(), '| senha =', JSON.stringify(await page.getByLabel('Senha', { exact: true }).inputValue()));
  await page.screenshot({ path: SHOTS + '/rede-falha-post-1440.png', fullPage: true });
  await ctx.close();

  // Falha de rede no GET de disponibilidade: links somem; /cadastro mostra alerta com nova tentativa
  ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  page = await ctx.newPage();
  let fail = true;
  await page.route('**/api/auth/signup', (route) => (route.request().method() === 'GET' && fail) ? route.abort('internetdisconnected') : route.continue());
  await page.goto(BASE + '/login'); await page.waitForLoadState('networkidle');
  log('REDE GET: links Criar conta no login =', await page.getByRole('link', { name: 'Criar conta' }).count());
  await page.goto(BASE + '/cadastro'); await page.getByRole('alert').waitFor();
  log('REDE GET em /cadastro: alerta =', await page.getByRole('alert').innerText());
  await page.screenshot({ path: SHOTS + '/rede-falha-disponibilidade-1440.png' });
  fail = false;
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await page.getByRole('heading', { name: 'Criar sua conta' }).waitFor();
  log('  após Tentar novamente: formulário visível');
  await ctx.close();

  // Teclado (funcional): ordem do Tab e envio com Enter, sem mouse
  ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  page = await ctx.newPage();
  await page.goto(BASE + '/cadastro'); await page.getByRole('heading', { name: 'Criar sua conta' }).waitFor();
  await page.getByLabel('E-mail').focus();
  const order = [];
  for (let i = 0; i < 8; i++) { order.push(await page.evaluate(() => { const e = document.activeElement; return e.id || e.getAttribute('aria-label') || e.textContent.trim(); })); await page.keyboard.press('Tab'); }
  log('TECLADO ordem do Tab =', order.join(' > '));
  await page.getByLabel('E-mail').focus();
  await page.keyboard.press('Enter');
  log('TECLADO Enter com campos vazios: foco =', await page.evaluate(() => document.activeElement.id), '| erros =', JSON.stringify(await page.locator('.field-error').allInnerTexts()));
  const live = await page.evaluate(() => [...document.querySelectorAll('.field-error')].map((e) => ({ id: e.id, role: e.getAttribute('role'), live: e.closest('[aria-live]')?.getAttribute('aria-live') ?? null })));
  log('A11Y erros de campo: role/aria-live =', JSON.stringify(live));
  await ctx.close();
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
