const { test } = require('node:test');
const assert = require('node:assert/strict');
const { resolveRelease, resolveTagCommitSha } = require('./release-policy.cjs');

const sha = 'abc123def456';
const push = overrides => resolveRelease({
  eventName: 'push', ref: 'refs/tags/v1.2.3', inputVersion: '', sha, stageSha: sha, tagSha: sha,
  ...overrides,
});

test('push de tag SemVer publica somente o SHA atual de stage', () => {
  assert.equal(push(), 'v1.2.3');
  assert.throws(() => push({ stageSha: 'different' }), /stage/);
  assert.throws(() => push({ tagSha: 'different' }), /tag/);
});

test('push rejeita tags fora de SemVer estável, inclusive tags build', () => {
  for (const ref of ['refs/tags/build-abc123', 'refs/tags/v1.2.3-alpha', 'refs/tags/v1.2', 'refs/tags/v01.2.3']) {
    assert.throws(() => push({ ref }), /vMAJOR\.MINOR\.PATCH/);
  }
});

test('dispatch só recupera versão existente no SHA da ponta atual de stage', () => {
  const dispatch = overrides => resolveRelease({
    eventName: 'workflow_dispatch', ref: 'refs/heads/stage', inputVersion: 'v2.0.0',
    sha, stageSha: sha, tagSha: sha, ...overrides,
  });
  assert.equal(dispatch(), 'v2.0.0');
  assert.throws(() => dispatch({ ref: 'refs/heads/develop' }), /stage/);
  assert.throws(() => dispatch({ tagSha: null }), /tag/);
  assert.throws(() => dispatch({ tagSha: 'other' }), /tag/);
  assert.throws(() => dispatch({ inputVersion: 'v2.0.0-rc.1' }), /vMAJOR\.MINOR\.PATCH/);
});

test('eventos de branch e versões desconhecidas são rejeitados', () => {
  assert.throws(() => resolveRelease({ eventName: 'push', ref: 'refs/heads/stage' }), /tag/);
  assert.throws(() => resolveRelease({ eventName: 'schedule' }), /evento/);
});

test('tag leve resolve diretamente para commit', async () => {
  const github = { rest: { git: { getRef: async () => ({ data: { object: { type: 'commit', sha } } }) } } };
  assert.equal(await resolveTagCommitSha(github, { owner: 'o', repo: 'r' }, 'v1.2.3'), sha);
});

test('tag anotada é dereferenciada até o commit', async () => {
  const github = { rest: { git: {
    getRef: async () => ({ data: { object: { type: 'tag', sha: 'tag-object' } } }),
    getTag: async () => ({ data: { object: { type: 'commit', sha } } }),
  } } };
  assert.equal(await resolveTagCommitSha(github, { owner: 'o', repo: 'r' }, 'v1.2.3'), sha);
});
