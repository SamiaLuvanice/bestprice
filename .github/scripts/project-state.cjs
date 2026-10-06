function projectStatus(kind, item) {
  if (kind === 'pr') {
    if (item.state === 'closed') return item.merged ? 'Done' : 'Canceled';
    return item.draft ? 'In progress' : 'In review';
  }
  if (item.state === 'closed') return item.state_reason === 'not_planned' ? 'Canceled' : 'Done';
  return item.assignees?.length ? 'In progress' : 'Todo';
}
module.exports = { projectStatus };
