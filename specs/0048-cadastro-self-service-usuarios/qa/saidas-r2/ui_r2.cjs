const FE = 'C:/Users/luvan/Learning/bestprice/.worktrees/feature-0048-issue-252-cadastro-self-service/frontend/node_modules/';
const { chromium } = require(FE + 'playwright');
const { AxeBuilder } = require(FE + '@axe-core/playwright');
const BASE = 'http://127.0.0.1:5148'; const SHOTS = process.argv[2]; const log = (...a) => console.log(...a);
const VP = { desktop: { width: 1440, height: 1040 }, mobile: { width: 390, height: 899 } };
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
let b;
async function open(vp, path = '/cadastro', scheme = 'light') {
  const c = await b.newContext({ viewport: vp, colorScheme: scheme }); const p = await c.newPage();
  p.on('pageerror', (e) => log('  [pageerror]', e.message));
  await p.goto(BASE + path); await p.waitForLoadState('networkidle');
  if (path.startsWith('/cadastro')) await p.getByRole('heading', { name: 'Criar sua conta' }).waitFor();
  return { c, p };
}
async function fill(p, e, s, k) { await p.getByLabel('E-mail').fill(e); await p.getByLabel('Senha', { exact: true }).fill(s); await p.getByLabel('Confirmar senha').fill(k); }
async function axe(p, label) {
  const r = await new AxeBuilder({ page: p }).withTags(TAGS).analyze();
  log(`  axe ${label}: ${r.violations.length} violações` + (r.violations.length ? ' -> ' + r.violations.map((v) => `${v.id}(${v.nodes.length}: ${v.nodes.map((n) => n.target.join(' ')).join(' ; ')})`).join(', ') : ''));
  return r.violations;
}
async function status(p) { return p.locator('[role="status"]').first().innerText(); }
(async () => {
  b = await chromium.launch();
  for (const [name, vp] of Object.entries(VP).filter(([n]) => !process.argv[3] || n === process.argv[3])) {
    log(`=== ${name} ${vp.width}x${vp.height}`);
    let { c, p } = await open(vp);
    await p.screenshot({ path: `${SHOTS}/r2-cadastro-padrao-${name}.png` });
    log('  rolagem horizontal =', await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth));
    await axe(p, 'padrão (claro)');
    await p.getByLabel('E-mail').focus(); for (let i = 0; i < 3; i++) await p.keyboard.press('Tab');
    log('  foco após 3 Tab =', await p.evaluate(() => document.activeElement.id));
    await p.screenshot({ path: `${SHOTS}/r2-cadastro-foco-${name}.png` });
    await p.getByLabel('E-mail').focus();
    const stops = [];
    for (let i = 0; i < 8; i++) {
      stops.push(await p.evaluate(() => { const e = document.activeElement; const s = getComputedStyle(e);
        return `${e.id || e.getAttribute('aria-label') || e.textContent.trim()}[outline ${s.outlineStyle} ${s.outlineWidth}${s.boxShadow !== 'none' ? ' + box-shadow' : ''}; ${Math.round(e.getBoundingClientRect().height)}px]`; }));
      await p.keyboard.press('Tab');
    }
    log('  paradas do Tab =', stops.join(' > '));
    await fill(p, 'ana@exemplo', '123456', '12345678');
    await p.getByRole('button', { name: 'Criar conta' }).click();
    await p.waitForTimeout(300);
    log('  erros =', JSON.stringify(await p.locator('.field-error').allInnerTexts()));
    log('  role=status =', JSON.stringify(await status(p)), '| foco =', await p.evaluate(() => document.activeElement.id));
    log('  aria-describedby senha =', await p.getByLabel('Senha', { exact: true }).getAttribute('aria-describedby'), '| dica presente =', await p.getByText('Use pelo menos 12 caracteres.').count());
    await p.screenshot({ path: `${SHOTS}/r2-cadastro-erros-campos-${name}.png` });
    await axe(p, 'erros de campo (claro)');
    await c.close();
    ({ c, p } = await open(vp, '/cadastro', 'dark'));
    await axe(p, 'padrão (escuro)');
    await fill(p, 'ana@exemplo', '123456', '12345678'); await p.getByRole('button', { name: 'Criar conta' }).click(); await p.waitForTimeout(300);
    await axe(p, 'erros de campo (escuro)');
    await p.screenshot({ path: `${SHOTS}/r2-cadastro-erros-campos-escuro-${name}.png` });
    await c.close();
    ({ c, p } = await open(vp));
    await p.route('**/api/auth/signup', async (r) => { if (r.request().method() === 'POST') { await new Promise((ok) => setTimeout(ok, 2500)); return r.continue(); } return r.continue(); });
    await fill(p, 'rita@exemplo.com', 'senha-qualquer-envio-1', 'senha-qualquer-envio-1');
    await p.getByRole('button', { name: 'Criar conta' }).click(); await p.waitForTimeout(500);
    const btn = p.locator('button[type=submit]');
    log('  enviando: botão =', JSON.stringify(await btn.innerText()), 'aria-busy =', await btn.getAttribute('aria-busy'), 'aria-disabled =', await btn.getAttribute('aria-disabled'));
    await p.screenshot({ path: `${SHOTS}/r2-cadastro-enviando-${name}.png` });
    await p.locator('#signup-email-error').waitFor({ timeout: 10000 });
    log('  409: erro =', JSON.stringify(await p.locator('#signup-email-error').innerText()), '| status =', JSON.stringify(await status(p)), '| foco =', await p.evaluate(() => document.activeElement.id));
    await p.screenshot({ path: `${SHOTS}/r2-cadastro-email-ja-cadastrado-${name}.png` });
    await axe(p, '409 (claro)');
    await p.unroute('**/api/auth/signup');
    for (let i = 0; i < 7; i++) {
      await fill(p, 'rita@exemplo.com', 'senha-qualquer-limite-' + i, 'senha-qualquer-limite-' + i);
      const w = p.waitForResponse((r) => r.url().includes('/api/auth/signup') && r.request().method() === 'POST');
      await p.getByRole('button', { name: 'Criar conta' }).click(); const r = await w;
      if (r.status() === 429) { await p.getByRole('alert').waitFor(); log(`  429 após ${i + 1} envio(s): alerta =`, JSON.stringify(await p.getByRole('alert').innerText()), '| status =', JSON.stringify(await status(p))); break; }
    }
    await p.screenshot({ path: `${SHOTS}/r2-cadastro-limite-${name}.png` });
    await axe(p, 'limite (claro)');
    await c.close();
    ({ c, p } = await open(vp));
    await p.route('**/api/auth/signup', (r) => r.request().method() === 'POST' ? r.abort('internetdisconnected') : r.continue());
    await fill(p, 'ana@exemplo.com', 'senha-de-rede-12345', 'senha-de-rede-12345');
    await p.getByRole('button', { name: 'Criar conta' }).click(); await p.getByRole('alert').waitFor();
    log('  rede: alerta =', JSON.stringify(await p.getByRole('alert').innerText()));
    await p.screenshot({ path: `${SHOTS}/r2-cadastro-falha-de-rede-${name}.png` });
    await c.close();
    ({ c, p } = await open(vp, '/login'));
    const link = p.getByRole('link', { name: 'Criar conta' });
    const bb = await link.boundingBox();
    log('  login: Criar conta =', await link.count(), `alvo ${Math.round(bb.width)}x${Math.round(bb.height)}`, 'decoração =', await link.evaluate((e) => getComputedStyle(e).textDecorationLine));
    await p.screenshot({ path: `${SHOTS}/r2-login-${name}.png` });
    await axe(p, 'login (claro)');
    await c.close();
  }
  let { c, p } = await open({ width: 1440, height: 1040 }, '/');
  const nav = await p.evaluate(() => [...document.querySelectorAll('#public-navigation a')].map((a) => { const r = a.getBoundingClientRect(); return `${a.textContent.trim()}@x${Math.round(r.x)} ${Math.round(r.width)}x${Math.round(r.height)}`; }));
  log('=== landing 1440: links (ordem do DOM, x) =', nav.join(' | '));
  await p.screenshot({ path: `${SHOTS}/r2-landing-desktop.png` });
  await axe(p, 'landing desktop (claro)');
  await c.close();
  ({ c, p } = await open({ width: 390, height: 844 }, '/'));
  await p.getByRole('button', { name: 'Abrir menu' }).click(); await p.waitForTimeout(300);
  const navm = await p.evaluate(() => [...document.querySelectorAll('#public-navigation a')].map((a) => { const r = a.getBoundingClientRect(); return `${a.textContent.trim()}@y${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}`; }));
  log('=== landing 390 menu aberto =', navm.join(' | '));
  await p.screenshot({ path: `${SHOTS}/r2-landing-menu-aberto-mobile.png` });
  await axe(p, 'landing menu aberto (claro)');
  await c.close();
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
