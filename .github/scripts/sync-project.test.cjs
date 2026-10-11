const { test } = require('node:test');
const assert = require('node:assert/strict');
const sync = require('./sync-project.cjs');

const options = ['Backlog', 'Ready', 'In progress', 'In review', 'Develop', 'Stage', 'Main']
  .map((name, index) => ({ id: `option-${index}`, name }));
const READY = 'option-1';
const notFound = () => Object.assign(new Error('Not Found'), { status: 404 });

// branches: { nome: texto de specs/<spec>-x/spec.md | null (branch ainda sem spec) }
function fixture({ kind = 'pr', item, closingEvents = [], availableOptions = options, branches = {},
  push, issueMissing = false } = {}) {
  const project = { status: null, added: false, writes: 0 };
  const calls = [];
  const specDir = name => `${name.split('/')[1].slice(0, 4)}-x`;
  const github = {
    paginate: async (_method, { ref }) => Object.keys(branches)
      .filter(name => `heads/${name}`.startsWith(ref)).map(name => ({ ref: `refs/heads/${name}` })),
    rest: {
      pulls: { get: async () => ({ data: item || { state: 'closed', merged: true, base: { ref: 'develop' }, node_id: 'PR_1' } }) },
      issues: { get: async () => {
        if (issueMissing) throw notFound();
        return { data: item || { state: 'closed', state_reason: 'completed', closed_at: '2026-01-01T00:00:00Z', node_id: 'ISSUE_1' } };
      } },
      git: {
        listMatchingRefs: () => {},
        getRef: async ({ ref }) => {
          const name = ref.replace(/^heads\//, '');
          if (!(name in branches)) throw notFound();
          return { data: { object: { sha: name } } };
        },
      },
      repos: {
        compareCommitsWithBasehead: async () => ({ data: { files: push?.files || [] } }),
        getContent: async ({ path, ref }) => {
          const text = branches[ref];
          if (path === 'specs') return { data: text === null ? [] : [{ type: 'dir', name: specDir(ref) }] };
          return { data: { content: Buffer.from(text).toString('base64'), encoding: 'base64' } };
        },
      },
    },
    graphql: async (query, variables) => {
      calls.push(query);
      if (query.includes('repositoryOwner')) return { repositoryOwner: { projectV2: { id: 'P_1' } } };
      if (query.includes('timelineItems')) {
        // Como a API: first: N devolve os N mais antigos e last: N os N mais recentes, em ordem cronológica.
        const [, edge, size] = query.match(/timelineItems\((first|last): (\d+)/) || [];
        if (!edge) throw new Error('Consulta de timeline sem first/last.');
        const nodes = edge === 'last' ? closingEvents.slice(-Number(size)) : closingEvents.slice(0, Number(size));
        return { node: { timelineItems: { nodes } } };
      }
      if (query.includes('fields(first')) return { node: { fields: {
        nodes: [{ id: 'status', name: 'Status', options: availableOptions }], pageInfo: { hasNextPage: false },
      } } };
      if (query.includes('addProjectV2ItemById')) {
        project.added = true;
        return { addProjectV2ItemById: { item: { id: 'I_1' } } };
      }
      project.status = variables.option;
      project.writes += 1;
      return {};
    },
  };
  const summaries = [];
  const core = { summary: { addRaw: text => ({ write: async () => summaries.push(text) }) } };
  const event = push
    ? { eventName: 'push', ref: `refs/heads/${push.branch}`,
      payload: { before: push.before || 'b'.repeat(40), after: 'a'.repeat(40) } }
    : { eventName: kind === 'pr' ? 'pull_request_target' : 'issues',
      payload: kind === 'pr' ? { pull_request: { number: 13 } } : { issue: { number: 13 } } };
  return { args: { github, core, context: { repo: { owner: 'owner', repo: 'repo' }, ...event } }, project, calls, summaries };
}

function configure() {
  process.env.PROJECT_OWNER = 'owner';
  process.env.PROJECT_NUMBER = '1';
}

const openIssue = (assignees = []) => ({ state: 'open', assignees, node_id: 'ISSUE_1' });
const spec = status => `---\nnumero: 0014\nstatus: ${status}\n---\n`;
const changed = [{ filename: 'specs/0014-x/spec.md' }];
const branch = 'feature/0014-issue-13-x';

test('reexecução de evento antigo usa a base atual da PR e é idempotente', async () => {
  process.env.PROJECT_OWNER = 'owner';
  process.env.PROJECT_NUMBER = '1';
  const { args, project } = fixture({ item: { state: 'closed', merged: true, base: { ref: 'stage' }, node_id: 'PR_1' } });
  await sync(args);
  await sync(args);
  assert.equal(project.status, 'option-5');
  assert.equal(project.writes, 2);
});

test('Issue fechada resolve PR vinculada pelo instante do fechamento e branch padrão', async () => {
  process.env.PROJECT_OWNER = 'owner';
  process.env.PROJECT_NUMBER = '1';
  const closedAt = '2026-01-01T00:00:00Z';
  const { args, project } = fixture({ kind: 'issue', item: { state: 'closed', state_reason: 'completed', closed_at: closedAt, node_id: 'ISSUE_1' }, closingEvents: [
    { createdAt: '2025-12-31T23:59:59Z', closer: { baseRefName: 'develop', mergedAt: '2025-12-31T23:59:59Z' } },
    { createdAt: closedAt, closer: { baseRefName: 'develop', mergedAt: '2025-12-31T23:59:59Z' } },
  ] });
  await sync(args);
  assert.equal(project.status, 'option-4');
});

test('Issue fechada por PR com evento registrado 1 s depois de closed_at vai para Develop', async () => {
  process.env.PROJECT_OWNER = 'owner';
  process.env.PROJECT_NUMBER = '1';
  const { args, project } = fixture({ kind: 'issue', item: { state: 'closed', state_reason: 'completed', closed_at: '2026-10-11T18:49:46Z', node_id: 'ISSUE_1' }, closingEvents: [
    { createdAt: '2026-10-11T18:49:47Z', closer: { baseRefName: 'develop', mergedAt: '2026-10-11T18:49:45Z' } },
  ] });
  await sync(args);
  assert.equal(project.status, 'option-4');
});

test('Issue reaberta e fechada manualmente não herda a PR de um fechamento anterior', async () => {
  process.env.PROJECT_OWNER = 'owner';
  process.env.PROJECT_NUMBER = '1';
  const { args, project } = fixture({ kind: 'issue', item: { state: 'closed', state_reason: 'completed', closed_at: '2026-01-02T00:00:00Z', node_id: 'ISSUE_1' }, closingEvents: [
    { createdAt: '2026-01-01T00:00:00Z', closer: { baseRefName: 'develop', mergedAt: '2026-01-01T00:00:00Z' } },
    { createdAt: '2026-01-02T00:00:00Z', closer: null },
  ] });
  await sync(args);
  assert.equal(project.status, 'option-0');
});

test('fechamento manual 30 s depois de um merge usa o evento mais recente, não o da PR', async () => {
  process.env.PROJECT_OWNER = 'owner';
  process.env.PROJECT_NUMBER = '1';
  const { args, project } = fixture({ kind: 'issue', item: { state: 'closed', state_reason: 'completed', closed_at: '2026-01-01T00:00:30Z', node_id: 'ISSUE_1' }, closingEvents: [
    { createdAt: '2026-01-01T00:00:00Z', closer: { baseRefName: 'develop', mergedAt: '2026-01-01T00:00:00Z' } },
    { createdAt: '2026-01-01T00:00:30Z', closer: null },
  ] });
  await sync(args);
  assert.equal(project.status, 'option-0');
});

test('Issue cujo fechamento mais recente está distante de closed_at não é atribuída à PR', async () => {
  process.env.PROJECT_OWNER = 'owner';
  process.env.PROJECT_NUMBER = '1';
  const { args, project } = fixture({ kind: 'issue', item: { state: 'closed', state_reason: 'completed', closed_at: '2026-01-02T00:00:00Z', node_id: 'ISSUE_1' }, closingEvents: [
    { createdAt: '2026-01-01T00:00:00Z', closer: { baseRefName: 'develop', mergedAt: '2026-01-01T00:00:00Z' } },
  ] });
  await sync(args);
  assert.equal(project.status, 'option-0');
});

function closedIssue(closedAt, eventAt) {
  return fixture({ kind: 'issue', item: { state: 'closed', state_reason: 'completed', closed_at: closedAt, node_id: 'ISSUE_1' }, closingEvents: [
    { createdAt: eventAt, closer: { baseRefName: 'develop', mergedAt: '2026-01-01T00:00:00Z' } },
  ] });
}

test('fechamento a 60 s de closed_at é aceito e a 61 s não', async () => {
  process.env.PROJECT_OWNER = 'owner';
  process.env.PROJECT_NUMBER = '1';
  const accepted = closedIssue('2026-01-01T00:00:00Z', '2026-01-01T00:01:00Z');
  await sync(accepted.args);
  assert.equal(accepted.project.status, 'option-4');
  const rejected = closedIssue('2026-01-01T00:00:00Z', '2026-01-01T00:01:01Z');
  await sync(rejected.args);
  assert.equal(rejected.project.status, 'option-0');
});

test('closed_at ausente ou inválido não atribui o fechamento à PR', async () => {
  process.env.PROJECT_OWNER = 'owner';
  process.env.PROJECT_NUMBER = '1';
  for (const closedAt of [null, 'invalido']) {
    const { args, project } = closedIssue(closedAt, '2026-01-01T00:00:00Z');
    await sync(args);
    assert.equal(project.status, 'option-0');
  }
});

test('Issue não planejada retorna a Backlog e informa falta de Canceled', async () => {
  process.env.PROJECT_OWNER = 'owner';
  process.env.PROJECT_NUMBER = '1';
  const { args, project, summaries } = fixture({ kind: 'issue', item: { state: 'closed', state_reason: 'not_planned', closed_at: '2026-01-01T00:00:00Z', node_id: 'ISSUE_1' } });
  await sync(args);
  assert.equal(project.status, 'option-0');
  assert.match(summaries[0], /não tem opção Canceled/);
});

test('branch-base não suportada falha antes de descobrir ou alterar o Project', async () => {
  process.env.PROJECT_OWNER = 'owner';
  process.env.PROJECT_NUMBER = '1';
  const { args, project, calls } = fixture({ item: { state: 'closed', merged: true, base: { ref: 'release' }, node_id: 'PR_1' } });
  await assert.rejects(sync(args), /branch-base 'release' não suportada/);
  assert.equal(project.added, false);
  assert.equal(calls.length, 0);
});

test('status exigido ausente falha antes de adicionar item', async () => {
  process.env.PROJECT_OWNER = 'owner';
  process.env.PROJECT_NUMBER = '1';
  const { args, project } = fixture({ availableOptions: options.filter(option => option.name !== 'Stage'), item: { state: 'closed', merged: true, base: { ref: 'stage' }, node_id: 'PR_1' } });
  await assert.rejects(sync(args), /Crie a opção 'Stage'/);
  assert.equal(project.added, false);
});

test('ausência da credencial é informativa e não declara sucesso de sincronização', async () => {
  delete process.env.PROJECT_OWNER;
  delete process.env.PROJECT_NUMBER;
  const { args, project, summaries } = fixture();
  await assert.rejects(sync(args), /Configure PROJECT_OWNER e PROJECT_NUMBER/);
  assert.equal(project.added, false);
  assert.equal(summaries.length, 0);
});

test('push que torna a spec pronta leva a Issue da branch a Ready', async () => {
  configure();
  const { args, project, summaries } = fixture({ item: openIssue(), branches: { [branch]: spec('pronta') },
    push: { branch, files: changed } });
  await sync(args);
  assert.equal(project.status, READY);
  assert.match(summaries[0], /issue #13: Ready/);
});

test('push que tira a spec de pronta devolve a Issue a Backlog', async () => {
  configure();
  for (const status of ['rascunho', 'implementada', 'descartada']) {
    const { args, project } = fixture({ item: openIssue(), branches: { [branch]: spec(status) }, push: { branch, files: changed } });
    await sync(args);
    assert.equal(project.status, 'option-0', status);
  }
});

test('responsável tem precedência sobre spec pronta', async () => {
  configure();
  const { args, project } = fixture({ item: openIssue([{}]), branches: { [branch]: spec('pronta') }, push: { branch, files: changed } });
  await sync(args);
  assert.equal(project.status, 'option-2');
});

test('evento de Issue e reconciliação manual consideram a spec da branch', async () => {
  configure();
  const branches = { [branch]: spec('pronta'), 'feature/0015-issue-14-y': spec('pronta') };
  const event = fixture({ kind: 'issue', item: openIssue(), branches });
  await sync(event.args);
  assert.equal(event.project.status, READY);

  const manual = fixture({ kind: 'issue', item: openIssue(), branches });
  manual.args.context = { ...manual.args.context, eventName: 'workflow_dispatch', payload: { inputs: { kind: 'issue', number: '13' } } };
  await sync(manual.args);
  assert.equal(manual.project.status, READY);

  const other = fixture({ kind: 'issue', item: openIssue(), branches: { 'feature/0015-issue-14-y': spec('pronta') } });
  await sync(other.args);
  assert.equal(other.project.status, 'option-0');
});

test('branch recém-criada sem spec mantém Backlog sem aviso', async () => {
  configure();
  const { args, project, summaries } = fixture({ kind: 'issue', item: openIssue(), branches: { [branch]: null } });
  await sync(args);
  assert.equal(project.status, 'option-0');
  assert.doesNotMatch(summaries[0], /ilegíve/);
});

test('spec ilegível mantém Backlog, avisa no resumo e não falha', async () => {
  configure();
  const { args, project, summaries } = fixture({ item: openIssue(), branches: { [branch]: spec('prontaa') }, push: { branch, files: changed } });
  await sync(args);
  assert.equal(project.status, 'option-0');
  assert.match(summaries[0], /feature\/0014-issue-13-x: status 'prontaa' inválido/);
});

test('Issue fechada ignora a spec da branch', async () => {
  configure();
  const { args, project } = fixture({ kind: 'issue', branches: { [branch]: spec('pronta') },
    item: { state: 'closed', state_reason: 'not_planned', closed_at: '2026-01-01T00:00:00Z', node_id: 'ISSUE_1' } });
  await sync(args);
  assert.equal(project.status, 'option-0');
});

test('push fora do padrão ou sem alterar a spec da branch não altera o Project', async () => {
  configure();
  const outside = fixture({ item: openIssue(), push: { branch: 'fix/issue-13-x', files: changed } });
  await sync(outside.args);
  assert.equal(outside.calls.length, 0);
  assert.match(outside.summaries[0], /fora do padrão/);

  const merged = fixture({ item: openIssue(), branches: { [branch]: spec('pronta') },
    push: { branch, files: [{ filename: 'specs/0013-y/spec.md' }] } });
  await sync(merged.args);
  assert.equal(merged.calls.length, 0);
  assert.match(merged.summaries[0], /spec 0014 não alterada/);
});

test('primeiro push da branch é tratado como alteração da spec', async () => {
  configure();
  const { args, project } = fixture({ item: openIssue(), branches: { [branch]: spec('pronta') },
    push: { branch, before: '0'.repeat(40), files: [] } });
  await sync(args);
  assert.equal(project.status, READY);
});

test('push que aponta Issue inexistente ou PR não altera o Project e não falha', async () => {
  configure();
  const missing = fixture({ issueMissing: true, branches: { [branch]: spec('pronta') }, push: { branch, files: changed } });
  await sync(missing.args);
  assert.equal(missing.calls.length, 0);
  assert.match(missing.summaries[0], /#13 não encontrada/);

  const pr = fixture({ item: { ...openIssue(), pull_request: {} }, branches: { [branch]: spec('pronta') }, push: { branch, files: changed } });
  await sync(pr.args);
  assert.equal(pr.calls.length, 0);
  assert.match(pr.summaries[0], /#13 é uma Pull Request/);
});
