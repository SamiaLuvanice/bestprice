const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validatePullRequest, checkPullRequest } = require('./policy.cjs');

function pull(overrides = {}) {
  return { base: { ref: 'develop', repo: { full_name: 'owner/repo' } },
    head: { ref: 'feature/0006-issue-12-github-workflow', repo: { full_name: 'owner/repo' } },
    body: 'Closes #12', ...overrides };
}

test('uma tarefa exige fechamento explícito da Issue indicada na branch', () => {
  assert.equal(validatePullRequest(pull()), 12);
  assert.throws(() => validatePullRequest(pull({ body: 'Relacionado a #12' })), /Closes/);
  assert.throws(() => validatePullRequest(pull({ body: 'Closes #13' })), /Issue/);
  assert.throws(() => validatePullRequest(pull({ body: 'Closes #12\nCloses #13' })), /uma Issue/);
});

test('referência em comentário ou bloco de código não fecha tarefa', () => {
  assert.throws(() => validatePullRequest(pull({ body: '<!-- Closes #12 -->' })), /Closes/);
  assert.throws(() => validatePullRequest(pull({ body: '```\nCloses #12\n```' })), /Closes/);
});

test('promoções só aceitam a branch anterior do mesmo repositório', () => {
  assert.equal(validatePullRequest(pull({ base: { ref: 'main', repo: { full_name: 'owner/repo' } },
    head: { ref: 'stage', repo: { full_name: 'owner/repo' } }, body: '' })), null);
  assert.throws(() => validatePullRequest(pull({ base: { ref: 'main', repo: { full_name: 'owner/repo' } } })), /stage/);
  assert.throws(() => validatePullRequest(pull({ base: { ref: 'stage', repo: { full_name: 'owner/repo' } },
    head: { ref: 'develop', repo: { full_name: 'fork/repo' } } })), /mesmo repositório/);
});

test('sincronização reversa preserva a ancestralidade das branches protegidas', () => {
  const sync = (base, head, repository = 'owner/repo') => pull({
    base: { ref: base, repo: { full_name: 'owner/repo' } },
    head: { ref: head, repo: { full_name: repository } }, body: '',
  });
  assert.equal(validatePullRequest(sync('stage', 'main')), null);
  assert.equal(validatePullRequest(sync('develop', 'stage')), null);
  assert.throws(() => validatePullRequest(sync('develop', 'stage', 'fork/repo')), /mesmo repositório/);
});

function apiFixture(issue, messages) {
  return {
    context: { repo: { owner: 'owner', repo: 'repo' }, payload: { pull_request: { ...pull(), number: 13 } } },
    github: { rest: { issues: { get: async () => ({ data: issue }) }, pulls: { listCommits: () => {} } },
      paginate: async () => messages.map(message => ({ sha: 'abc1234', parents: [{}], commit: { message } })) },
  };
}

test('API rejeita PR usada como Issue e Issue já fechada', async () => {
  await assert.rejects(checkPullRequest(apiFixture({ state: 'open', pull_request: {} }, [])), /Issue aberta/);
  await assert.rejects(checkPullRequest(apiFixture({ state: 'closed' }, [])), /Issue aberta/);
});

test('todos os commits de tarefa precisam referenciar a Issue exata', async () => {
  await checkPullRequest(apiFixture({ state: 'open' }, ['feat(ci): configura\n\nRefs #12']));
  await assert.rejects(checkPullRequest(apiFixture({ state: 'open' }, ['Refs #12', 'Refs #123'])), /precisa de Refs #12/);
});
