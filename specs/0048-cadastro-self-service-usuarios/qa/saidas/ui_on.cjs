const { chromium } = require('C:/Users/luvan/Learning/bestprice/.worktrees/feature-0048-issue-252-cadastro-self-service/frontend/node_modules/playwright');
const BASE = 'http://127.0.0.1:5148';
const SHOTS = process.argv[2];
const log = (...a) => console.log(...a);
const path = (p) => p.url().replace(BASE, '');
async function fill(page, email, pw, conf) {
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha', { exact: true }).fill(pw);
  await page.getByLabel('Confirmar senha').fill(conf);
}
(async () => {
  const browser = await chromium.launch();
  let posts = 0;
  const newCtx = async (vp = { width: 1440, height: 900 }) => {
    const ctx = await browser.newContext({ viewport: vp });
    const page = await ctx.newPage();
    page.on('request', (r) => { if (r.url().includes('/api/auth/signup') && r.method() === 'POST') posts++; });
    page.on('console', (m) => { if (m.type() === 'error') log('  [console.error]', m.text()); });
    return { ctx, page };
  };

  // AC01 + AC02: landing -> Criar conta (landing e login), validação local, cadastro -> painel vazio
  let { ctx, page } = await newCtx();
  await page.goto(BASE + '/'); await page.waitForLoadState('networkidle');
  log('AC01 landing: links Criar conta =', await page.getByRole('link', { name: 'Criar conta' }).count());
  await page.screenshot({ path: SHOTS + '/ac01-landing-1440.png' });
  await page.goto(BASE + '/login'); await page.waitForLoadState('networkidle');
  log('AC01 login: links Criar conta =', await page.getByRole('link', { name: 'Criar conta' }).count());
  await page.getByRole('link', { name: 'Criar conta' }).click();
  await page.getByRole('heading', { name: 'Criar sua conta' }).waitFor();
  log('AC01 clique no login ->', path(page), '| título:', await page.title());
  await page.screenshot({ path: SHOTS + '/ac01-cadastro-1440.png', fullPage: true });
  log('AC13 aviso de privacidade visível antes do envio =', await page.getByText('Usamos seu e-mail só para identificar sua conta').isVisible());

  // validação local (não envia)
  await fill(page, 'a@b', 'curta', 'diferente');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  const emailBox = page.getByLabel('E-mail');
  log('AC05/AC06 local: erros =', JSON.stringify(await page.locator('.field-error').allInnerTexts()));
  log('  foco no 1º inválido =', await page.evaluate(() => document.activeElement?.id), '| aria-invalid e-mail =', await emailBox.getAttribute('aria-invalid'), '| describedby =', await emailBox.getAttribute('aria-describedby'));
  log('  valores preservados =', await emailBox.inputValue(), '/', (await page.getByLabel('Senha', { exact: true }).inputValue()).length, 'chars');
  await page.screenshot({ path: SHOTS + '/ac05-ac06-erros-locais-1440.png', fullPage: true });
  await fill(page, 'maria@exemplo.com', 'senha-da-maria-123', 'senha-da-maria-1234');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  log('AC06 confirmação diferente: erros =', JSON.stringify(await page.locator('.field-error').allInnerTexts()));
  log('POSTs até aqui (validação local não envia) =', posts);

  await fill(page, 'Maria@Exemplo.com', 'senha-da-maria-123', 'senha-da-maria-123');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await page.waitForURL('**/app/dashboard', { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  log('AC02 cadastro ->', path(page));
  await page.screenshot({ path: SHOTS + '/ac02-painel-vazio-1440.png', fullPage: true });
  const me = await page.request.get(BASE + '/api/auth/me'); log('AC02 /me no navegador =', me.status(), await me.text());
  const dash = await page.request.get(BASE + '/api/dashboard'); log('AC11 /dashboard =', await dash.text());
  // AC01: com sessão, /cadastro -> painel
  await page.goto(BASE + '/cadastro'); await page.waitForURL('**/app/dashboard', { timeout: 10000 });
  log('AC01 /cadastro com sessão ->', path(page));
  await ctx.close();

  // AC02 com returnTo a partir de "Começar com IA"
  ({ ctx, page } = await newCtx());
  await page.goto(BASE + '/'); await page.waitForLoadState('networkidle');
  await page.getByRole('link', { name: 'Começar com IA' }).first().click();
  await page.getByRole('heading', { name: 'Entrar na sua conta' }).waitFor();
  log('AC02 Começar com IA sem sessão ->', path(page));
  const href = await page.getByRole('link', { name: 'Criar conta' }).getAttribute('href');
  log('  link Criar conta no login =', href);
  await page.getByRole('link', { name: 'Criar conta' }).click();
  await page.getByRole('heading', { name: 'Criar sua conta' }).waitFor();
  log('  cadastro aberto em', path(page));
  await fill(page, 'joao@exemplo.com', 'senha-do-joao-12345', 'senha-do-joao-12345');
  await page.keyboard.press('Enter');
  await page.waitForURL('**/app/assistant', { timeout: 15000 });
  log('AC02 cadastro com returnTo ->', path(page));
  await page.screenshot({ path: SHOTS + '/ac02-returnto-assistente-1440.png' });
  await ctx.close();

  // AC07 pela UI: e-mail já cadastrado -> mensagem + atalho Entrar, senhas limpas, e-mail preservado
  ({ ctx, page } = await newCtx());
  await page.goto(BASE + '/cadastro?returnTo=%2Fapp%2Fassistant'); await page.getByRole('heading', { name: 'Criar sua conta' }).waitFor();
  await fill(page, 'ana@exemplo.com', 'outra-senha-qualquer-1', 'outra-senha-qualquer-1');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await page.locator('#signup-email-error').waitFor();
  log('AC07 UI: erro e-mail =', await page.locator('#signup-email-error').innerText());
  log('  atalho Entrar ->', await page.locator('#signup-email-error a').getAttribute('href'));
  log('  e-mail preservado =', await page.getByLabel('E-mail').inputValue(), '| senha =', JSON.stringify(await page.getByLabel('Senha', { exact: true }).inputValue()), '| confirmação =', JSON.stringify(await page.getByLabel('Confirmar senha').inputValue()));
  log('  URL continua', path(page));
  await page.screenshot({ path: SHOTS + '/ac07-duplicado-1440.png', fullPage: true });
  log('POSTs desta execução =', posts);
  await ctx.close();
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
