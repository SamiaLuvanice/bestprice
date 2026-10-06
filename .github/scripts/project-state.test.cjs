const { test } = require('node:test');
const assert = require('node:assert/strict');
const { projectStatus } = require('./project-state.cjs');

test('Issue usa somente estados existentes e distingue merge em develop', () => {
  assert.equal(projectStatus('issue', { state: 'open', assignees: [] }), 'Backlog');
  assert.equal(projectStatus('issue', { state: 'open', assignees: [{}] }), 'In progress');
  assert.equal(projectStatus('issue', { state: 'closed', state_reason: 'completed', closedByDefaultBranchPr: true }), 'Develop');
  assert.equal(projectStatus('issue', { state: 'closed', state_reason: 'not_planned' }), 'Backlog');
  assert.equal(projectStatus('issue', { state: 'closed', state_reason: 'completed', closedByDefaultBranchPr: false }), 'Backlog');
});

test('PR draft, revisão, fechamento e merge seguem a branch-base', () => {
  assert.equal(projectStatus('pr', { state: 'open', draft: true }), 'In progress');
  assert.equal(projectStatus('pr', { state: 'open', draft: false }), 'In review');
  assert.equal(projectStatus('pr', { state: 'closed', merged: false }), 'Backlog');
  assert.equal(projectStatus('pr', { state: 'closed', merged: true, base: { ref: 'develop' } }), 'Develop');
  assert.equal(projectStatus('pr', { state: 'closed', merged: true, base: { ref: 'stage' } }), 'Stage');
  assert.equal(projectStatus('pr', { state: 'closed', merged: true, base: { ref: 'main' } }), 'Main');
  assert.throws(() => projectStatus('pr', { state: 'closed', merged: true, base: { ref: 'release' } }), /branch-base 'release' não suportada/);
});
