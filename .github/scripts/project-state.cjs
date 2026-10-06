function projectStatus(kind, item) {
  if (kind === 'pr') {
    if (item.state === 'closed') {
      if (!item.merged) return 'Backlog';
      const statusByBase = { develop: 'Develop', stage: 'Stage', main: 'Main' };
      const status = statusByBase[item.base?.ref];
      if (!status) throw new Error(`branch-base '${item.base?.ref || '(ausente)'}' não suportada para PR mergeada.`);
      return status;
    }
    return item.draft ? 'In progress' : 'In review';
  }
  if (item.state === 'closed') {
    return item.closedByDefaultBranchPr ? 'Develop' : 'Backlog';
  }
  return item.assignees?.length ? 'In progress' : 'Backlog';
}

module.exports = { projectStatus };
