const { test } = require('node:test');
const assert = require('node:assert/strict');
const sync = require('./sync-project.cjs');

function fixture(options = [{ id: 'done', name: 'Done' }]) {
  const project = { status: null, added: false };
  const github = {
    rest: { pulls: { get: async () => ({ data: { state: 'closed', merged: true, node_id: 'PR_1' } }) } },
    graphql: async (query, variables) => {
      if (query.includes('repositoryOwner')) return { repositoryOwner: { projectV2: { id: 'P_1' } } };
      if (query.includes('fields(first')) return { node: { fields: {
        nodes: [{ id: 'status', name: 'Status', options }], pageInfo: { hasNextPage: false },
      } } };
      if (query.includes('addProjectV2ItemById')) {
        project.added = true;
        return { addProjectV2ItemById: { item: { id: 'I_1' } } };
      }
      project.status = variables.option;
      return {};
    },
  };
  const core = { summary: { addRaw: () => ({ write: async () => {} }) } };
  const context = { repo: { owner: 'owner', repo: 'repo' }, payload: { pull_request: { number: 13, state: 'open', draft: true } } };
  return { args: { github, core, context }, project };
}

test('reexecução de evento antigo usa o estado atual da PR', async () => {
  process.env.PROJECT_OWNER = 'owner';
  process.env.PROJECT_NUMBER = '1';
  const { args, project } = fixture();
  await sync(args);
  await sync(args);
  assert.equal(project.status, 'done');
});

test('campo Status incompleto falha sem adicionar item parcialmente configurado', async () => {
  process.env.PROJECT_OWNER = 'owner';
  process.env.PROJECT_NUMBER = '1';
  const { args, project } = fixture([]);
  await assert.rejects(sync(args), /Crie a opção 'Done'/);
  assert.equal(project.added, false);
});
