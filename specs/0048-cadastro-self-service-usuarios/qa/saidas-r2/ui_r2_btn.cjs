const FE = 'C:/Users/luvan/Learning/bestprice/.worktrees/feature-0048-issue-252-cadastro-self-service/frontend/node_modules/';
const { chromium } = require(FE + 'playwright');
const BASE = 'http://127.0.0.1:5148'; const log = (...a) => console.log(...a);
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 390, height: 899 } })).newPage();
  // 429 simulado no navegador (sem gastar tentativa real), só para medir o estilo do botão
  await p.route('**/api/auth/signup', (r) => r.request().method() === 'POST'
    ? r.fulfill({ status: 429, headers: { 'Retry-After': '900', 'content-type': 'application/json' }, body: JSON.stringify({ error: { code: 'signup_rate_limited', message: 'x', fields: [], tracked_product_id: null, retry_after_seconds: 900 } }) })
    : r.continue());
  await p.goto(BASE + '/cadastro'); await p.getByRole('heading', { name: 'Criar sua conta' }).waitFor();
  const btn = p.locator('button[type=submit]');
  const st = () => btn.evaluate((e) => { const s = getComputedStyle(e); return `bg=${s.backgroundColor} opacity=${s.opacity} color=${s.color} hover=${e.matches(':hover')} transition=${s.transitionProperty}/${s.transitionDuration}`; });
  log('repouso          :', await st());
  await btn.hover(); await p.waitForTimeout(600); log('hover            :', await st());
  await p.mouse.move(5, 5); await p.waitForTimeout(600);
  await p.getByLabel('E-mail').fill('ana@exemplo.com'); await p.getByLabel('Senha', { exact: true }).fill('senha-qualquer-123'); await p.getByLabel('Confirmar senha').fill('senha-qualquer-123');
  await btn.click(); await p.getByRole('alert').waitFor();
  log('após 429, mouse em cima (imediato):', await st());
  await p.waitForTimeout(800); log('após 429, mouse em cima (+800ms):', await st());
  await p.mouse.move(5, 5); await p.waitForTimeout(800); log('após 429, mouse fora (+800ms)   :', await st());
  log('alerta (15 min) =', JSON.stringify(await p.getByRole('alert').innerText()));
  await p.screenshot({ path: process.argv[2] + '/r2-cadastro-limite-15min-mouse-fora-mobile.png' });
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
