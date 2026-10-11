const { test } = require('node:test');
const assert = require('node:assert/strict');
const sync = require('./sync-project.cjs');

const options = ['Backlog', 'Ready', 'In progress', 'In review', 'Develop', 'Stage', 'Main']
  .map((name, index) => ({ id: `option-${index}`, name }));

function fixture({ kind = 'pr', item, closingEvents = [], availableOptions = options } = {}) {
  const project = { status: null, added: false, writes: 0 };
  const calls = [];
  const github = {
    rest: {
      pulls: { get: async () => ({ data: item || { state: 'closed', merged: true, base: { ref: 'develop' }, node_id: 'PR_1' } }) },
      issues: { get: async () => ({ data: item || { state: 'closed', state_reason: 'completed', closed_at: '2026-01-01T00:00:00Z', node_id: 'ISSUE_1' } }) },
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
  const payload = kind === 'pr'
    ? { pull_request: { number: 13 } }
    : { issue: { number: 13 } };
  return { args: { github, core, context: { repo: { owner: 'owner', repo: 'repo' }, payload } }, project, calls, summaries };
}

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
