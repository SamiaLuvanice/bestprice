const { chromium } = require('C:/Users/luvan/Learning/bestprice/.worktrees/feature-0048-issue-252-cadastro-self-service/frontend/node_modules/playwright');
const BASE = 'http://127.0.0.1:5148'; const SHOTS = process.argv[2]; const log = (...a) => console.log(...a);
async function observe(page, label) {
  for (const ms of [0, 1000, 3000, 6000]) {
    if (ms) await page.waitForTimeout(ms === 1000 ? 1000 : ms - (ms === 3000 ? 1000 : 3000));
    const txt = (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').slice(0, 120);
    log(`  ${label} t≈${ms}ms url=${page.url().replace(BASE, '')} h1=${JSON.stringify(await page.locator('h1').allInnerTexts())} texto="${txt}"`);
  }
}
(async () => {
  const b = await chromium.launch();
  const mk = async () => { const c = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await c.newPage();
    p.on('pageerror', (e) => log('  [pageerror]', e.message)); p.on('console', (m) => { if (m.type() !== 'debug' && m.type() !== 'info') log(`  [console.${m.type()}]`, m.text().slice(0, 200)); }); return { c, p }; };
  // 1) cadastro novo pela UI
  let { c, p } = await mk();
  await p.goto(BASE + '/cadastro'); await p.getByRole('heading', { name: 'Criar sua conta' }).waitFor();
  await p.getByLabel('E-mail').fill('paula@exemplo.com'); await p.getByLabel('Senha', { exact: true }).fill('senha-da-paula-123'); await p.getByLabel('Confirmar senha').fill('senha-da-paula-123');
  await p.getByRole('button', { name: 'Criar conta' }).click(); await p.waitForURL('**/app/dashboard');
  log('1) cadastro -> painel'); await observe(p, 'cadastro');
  await p.screenshot({ path: SHOTS + '/ac02-painel-apos-cadastro-1440.png', fullPage: true });
  // recarregar a página com a sessão do cadastro
  await p.reload(); await p.waitForLoadState('networkidle'); log('1b) recarregar'); await observe(p, 'reload');
  await c.close();
  // 2) login normal de conta existente -> painel (comparação)
  ({ c, p } = await mk());
  await p.goto(BASE + '/login'); await p.getByLabel('E-mail').fill('maria@exemplo.com'); await p.getByLabel('Senha', { exact: true }).fill('senha-da-maria-123');
  await p.getByRole('button', { name: 'Entrar' }).click(); await p.waitForURL('**/app/**');
  log('2) login -> painel'); await observe(p, 'login');
  await p.screenshot({ path: SHOTS + '/comparacao-painel-apos-login-1440.png', fullPage: true });
  await c.close(); await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
