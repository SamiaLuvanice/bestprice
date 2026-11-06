const { chromium } = require('C:/Users/luvan/Learning/bestprice/.worktrees/feature-0048-issue-252-cadastro-self-service/frontend/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await p.goto('http://127.0.0.1:5148/cadastro'); await p.getByRole('heading', { name: 'Criar sua conta' }).waitFor({ timeout: 20000 });
  await p.getByLabel('E-mail').fill('semdb@exemplo.com'); await p.getByLabel('Senha', { exact: true }).fill('senha-sem-banco-123'); await p.getByLabel('Confirmar senha').fill('senha-sem-banco-123');
  await p.getByRole('button', { name: 'Criar conta' }).click(); await p.getByRole('alert').waitFor({ timeout: 30000 });
  console.log('UI com banco parado: alerta =', await p.getByRole('alert').innerText(), '| URL =', p.url());
  await p.screenshot({ path: process.argv[2] + '/banco-parado-cadastro-1440.png', fullPage: true }); await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
