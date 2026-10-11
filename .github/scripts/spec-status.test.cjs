const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseFeatureBranch, parseSpecStatus, specChanged, issueSpecState } = require('./spec-status.cjs');

const repo = { owner: 'owner', repo: 'repo' };

// branches: { nome: { sha, dirs: ['0014-x'], specs: { '0014-x': texto | undefined } } }
function githubFor(branches) {
  const reads = [];
  const notFound = () => Object.assign(new Error('Not Found'), { status: 404 });
  const bySha = sha => Object.values(branches).find(branch => branch.sha === sha);
  return {
    reads,
    paginate: async (_method, { ref }) => Object.keys(branches)
      .filter(name => `heads/${name}`.startsWith(ref))
      .map(name => ({ ref: `refs/heads/${name}` })),
    rest: {
      git: {
        listMatchingRefs: () => {},
        getRef: async ({ ref }) => {
          const branch = branches[ref.replace(/^heads\//, '')];
          if (!branch) throw notFound();
          return { data: { object: { sha: branch.sha } } };
        },
      },
      repos: {
        getContent: async ({ path, ref }) => {
          reads.push({ path, ref });
          const branch = bySha(ref);
          if (path === 'specs') return { data: branch.dirs.map(name => ({ type: 'dir', name })) };
          const text = branch.specs?.[path.split('/')[1]];
          if (text === undefined) throw notFound();
          return { data: { content: Buffer.from(text).toString('base64'), encoding: 'base64' } };
        },
      },
    },
  };
}

test('somente feature/<spec>-issue-<n>-<slug> vincula spec e Issue', () => {
  assert.deepEqual(parseFeatureBranch('feature/0014-issue-39-project-ready'), { spec: '0014', issue: 39 });
  for (const name of ['feature/issue-39-x', 'fix/issue-39-x', 'docs/0014-issue-39-x',
    'feature/014-issue-39-x', 'feature/0014-issue-0-x', 'feature/0014-issue-39', 'develop']) {
    assert.equal(parseFeatureBranch(name), null, name);
  }
});

test('status vem do cabeçalho e ignora comentário', () => {
  assert.deepEqual(parseSpecStatus('---\nnumero: 0014\nstatus: pronta   # comentário\n---\n# Título'), { status: 'pronta' });
  assert.deepEqual(parseSpecStatus('\uFEFF---\r\nstatus: rascunho\r\n---\r\n'), { status: 'rascunho' });
  assert.deepEqual(parseSpecStatus('---\nstatus: implementada\n---'), { status: 'implementada' });
  assert.deepEqual(parseSpecStatus('---\nstatus: "pronta"\n---'), { status: 'pronta' });
  assert.deepEqual(parseSpecStatus("---\nstatus: 'pronta' # aspas simples\n---"), { status: 'pronta' });
});

test('spec.md grande demais para a API de conteúdo é ilegível, sem falhar', async () => {
  const github = githubFor({ 'feature/0014-issue-39-a': { sha: 'a1', dirs: ['0014-a'], specs: { '0014-a': '' } } });
  github.rest.repos.getContent = async ({ path }) => ({ data: path === 'specs'
    ? [{ type: 'dir', name: '0014-a' }]
    : { content: '', encoding: 'none' } });
  assert.deepEqual(await issueSpecState(github, repo, 39), {
    ready: false, warnings: ['feature/0014-issue-39-a: spec.md grande demais para leitura pela API'],
  });
});

test('cabeçalho ausente ou status inválido tornam a spec ilegível', () => {
  assert.match(parseSpecStatus('numero: 0008\nstatus: pronta\n---').error, /cabeçalho ausente/);
  assert.match(parseSpecStatus('---\nstatus: pronta\n').error, /cabeçalho sem fechamento/);
  assert.match(parseSpecStatus('---\nstatus: prontaa\n---').error, /status 'prontaa' inválido/);
  assert.match(parseSpecStatus('---\nnumero: 1\n---\nstatus: pronta').error, /status '\(ausente\)' inválido/);
});

test('push só conta quando altera a spec da própria branch', () => {
  assert.equal(specChanged([{ filename: 'specs/0014-x/spec.md' }], '0014'), true);
  assert.equal(specChanged([{ filename: 'specs/0013-y/spec.md' }, { filename: 'specs/0014-x/plan.md' }], '0014'), false);
  assert.equal(specChanged([], '0014'), false);
});

test('Issue fica pronta quando ao menos uma branch tem a spec pronta', async () => {
  const github = githubFor({
    'feature/0014-issue-39-a': { sha: 'a1', dirs: ['0014-a'], specs: { '0014-a': '---\nstatus: rascunho\n---' } },
    'feature/0015-issue-39-b': { sha: 'b1', dirs: ['0015-b'], specs: { '0015-b': '---\nstatus: pronta\n---' } },
    'feature/0016-issue-40-c': { sha: 'c1', dirs: ['0016-c'], specs: { '0016-c': '---\nstatus: pronta\n---' } },
  });
  assert.deepEqual(await issueSpecState(github, repo, 39), { ready: true, warnings: [] });
  assert.deepEqual(await issueSpecState(github, repo, 41), { ready: false, warnings: [] });
});

test('branch sem pasta ou sem spec.md fica fora de Ready sem aviso', async () => {
  const github = githubFor({
    'feature/0014-issue-39-a': { sha: 'a1', dirs: ['0013-outra'] },
    'feature/0014-issue-39-b': { sha: 'b1', dirs: ['0014-b'], specs: {} },
  });
  assert.deepEqual(await issueSpecState(github, repo, 39), { ready: false, warnings: [] });
});

test('spec ilegível ou pasta ambígua gera aviso com branch e motivo', async () => {
  const github = githubFor({
    'feature/0014-issue-39-a': { sha: 'a1', dirs: ['0014-a', '0014-b'] },
    'feature/0015-issue-39-b': { sha: 'b1', dirs: ['0015-b'], specs: { '0015-b': '---\nstatus: talvez\n---' } },
  });
  const state = await issueSpecState(github, repo, 39);
  assert.equal(state.ready, false);
  assert.deepEqual(state.warnings, [
    'feature/0014-issue-39-a: mais de uma pasta specs/0014-*',
    "feature/0015-issue-39-b: status 'talvez' inválido",
  ]);
});

test('leitura usa o SHA atual da branch, não o do evento', async () => {
  const github = githubFor({ 'feature/0014-issue-39-a': { sha: 'atual', dirs: ['0014-a'], specs: { '0014-a': '---\nstatus: pronta\n---' } } });
  await issueSpecState(github, repo, 39);
  assert.deepEqual(github.reads.map(read => read.ref), ['atual', 'atual']);
  assert.deepEqual(github.reads.map(read => read.path), ['specs', 'specs/0014-a/spec.md']);
});
