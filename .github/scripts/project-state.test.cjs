const { test } = require('node:test');
const assert = require('node:assert/strict');
const { projectStatus } = require('./project-state.cjs');

test('Issue distingue backlog, trabalho atribuído, conclusão e cancelamento', () => {
  assert.equal(projectStatus('issue', { state: 'open', assignees: [] }), 'Todo');
  assert.equal(projectStatus('issue', { state: 'open', assignees: [{}] }), 'In progress');
  assert.equal(projectStatus('issue', { state: 'closed', state_reason: 'completed' }), 'Done');
  assert.equal(projectStatus('issue', { state: 'closed', state_reason: 'not_planned' }), 'Canceled');
});

test('PR fechada sem merge não é entrega; draft reaberto volta a desenvolvimento', () => {
  assert.equal(projectStatus('pr', { state: 'open', draft: true }), 'In progress');
  assert.equal(projectStatus('pr', { state: 'open', draft: false }), 'In review');
  assert.equal(projectStatus('pr', { state: 'closed', merged: false }), 'Canceled');
  assert.equal(projectStatus('pr', { state: 'closed', merged: true }), 'Done');
});
