const { chromium } = require('C:/Users/luvan/Learning/bestprice/.worktrees/feature-0048-issue-252-cadastro-self-service/frontend/node_modules/playwright');
const BASE = 'http://127.0.0.1:5148';
const SHOTS = process.argv[2];
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const posts = [];
  page.on('request', (r) => { if (r.url().includes('/api/auth/signup') && r.method() === 'POST') posts.push(r.url()); });
  await page.goto(BASE + '/');
  await page.waitForLoadState('networkidle');
  console.log('landing: links "Criar conta" =', await page.getByRole('link', { name: 'Criar conta' }).count());
  await page.goto(BASE + '/login');
  await page.waitForLoadState('networkidle');
  console.log('login: links "Criar conta" =', await page.getByRole('link', { name: 'Criar conta' }).count());
  await page.goto(BASE + '/cadastro?returnTo=%2Fapp%2Fassistant');
  await page.waitForLoadState('networkidle');
  await page.getByRole('heading', { name: 'Entrar na sua conta' }).waitFor({ timeout: 10000 });
  console.log('/cadastro?returnTo=/app/assistant ->', page.url().replace(BASE, ''));
  console.log('formulario de cadastro presente =', await page.getByRole('heading', { name: 'Criar sua conta' }).count());
  await page.screenshot({ path: SHOTS + '/ac14-off-cadastro-redireciona-login.png' });
  // Login continua funcionando com o interruptor desligado e respeita o returnTo preservado.
  await page.getByLabel('E-mail').fill('ops@exemplo.com');
  await page.getByLabel('Senha', { exact: true }).fill('operacao-senha-forte-1');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL((u) => u.pathname.startsWith('/app'), { timeout: 15000 });
  console.log('login (off) ->', page.url().replace(BASE, ''));
  console.log('POSTs /api/auth/signup feitos pela UI =', posts.length);
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
