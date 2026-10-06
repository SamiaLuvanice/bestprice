const { projectStatus } = require('./project-state.cjs');

module.exports = async ({ github, context, core }) => {
  const kind = context.payload.pull_request ? 'pr' : context.payload.inputs?.kind || 'issue';
  const number = Number(context.payload.pull_request?.number || context.payload.issue?.number || context.payload.inputs?.number);
  if (!Number.isSafeInteger(number) || number <= 0 || !['pr', 'issue'].includes(kind)) throw new Error('Informe kind e number válidos.');
  const request = kind === 'pr'
    ? github.rest.pulls.get({ ...context.repo, pull_number: number })
    : github.rest.issues.get({ ...context.repo, issue_number: number });
  const { data: item } = await request; // estado atual, não um evento antigo da fila
  if (kind === 'issue' && item.pull_request) throw new Error('Use kind=pr para uma Pull Request.');

  if (kind === 'issue' && item.state === 'closed' && item.state_reason !== 'not_planned') {
    item.closedByDefaultBranchPr = await wasClosedByDefaultBranchPr(github, item.node_id, item.closed_at);
  }
  const status = projectStatus(kind, item);

  const owner = process.env.PROJECT_OWNER;
  const projectNumber = Number(process.env.PROJECT_NUMBER);
  if (!owner || !Number.isSafeInteger(projectNumber) || projectNumber <= 0) throw new Error('Configure PROJECT_OWNER e PROJECT_NUMBER.');
  const { repositoryOwner } = await github.graphql(`query($owner: String!, $number: Int!) {
    repositoryOwner(login: $owner) {
      ... on User { projectV2(number: $number) { id } }
      ... on Organization { projectV2(number: $number) { id } }
    }
  }`, { owner, number: projectNumber });
  const projectId = repositoryOwner?.projectV2?.id;
  if (!projectId) throw new Error('Project não encontrado ou sem acesso.');

  let statusField;
  let cursor = null;
  do {
    const { node } = await github.graphql(`query($id: ID!, $cursor: String) {
      node(id: $id) { ... on ProjectV2 { fields(first: 100, after: $cursor) {
        nodes { ... on ProjectV2SingleSelectField { id name options { id name } } }
        pageInfo { hasNextPage endCursor }
      } } }
    }`, { id: projectId, cursor });
    statusField = node.fields.nodes.find(field => field.name === 'Status');
    cursor = node.fields.pageInfo.hasNextPage ? node.fields.pageInfo.endCursor : null;
  } while (!statusField && cursor);
  if (!statusField) throw new Error("Campo 'Status' não encontrado no Project.");
  const option = statusField.options.find(value => value.name === status);
  if (!option) throw new Error(`Crie a opção '${status}' no campo Status do Project.`);

  const { addProjectV2ItemById } = await github.graphql(`mutation($project: ID!, $content: ID!) {
    addProjectV2ItemById(input: { projectId: $project, contentId: $content }) { item { id } }
  }`, { project: projectId, content: item.node_id });
  await github.graphql(`mutation($project: ID!, $item: ID!, $field: ID!, $option: String!) {
    updateProjectV2ItemFieldValue(input: { projectId: $project, itemId: $item,
      fieldId: $field, value: { singleSelectOptionId: $option } }) { projectV2Item { id } }
  }`, { project: projectId, item: addProjectV2ItemById.item.id, field: statusField.id, option: option.id });
  const cancellationNote = kind === 'issue' && item.state === 'closed' && item.state_reason === 'not_planned'
    ? ' Issue não planejada: o Project não tem opção Canceled; Backlog foi usado.'
    : '';
  await core.summary.addRaw(`${kind} #${number}: ${status}. Prioridade e ordenação preservadas.${cancellationNote}`).write();
};

async function wasClosedByDefaultBranchPr(github, issueNodeId, closedAt) {
  let before = null;
  do {
    const { node } = await github.graphql(`query($id: ID!, $before: String) {
      node(id: $id) { ... on Issue { timelineItems(last: 100, before: $before, itemTypes: [CLOSED_EVENT]) {
        nodes { ... on ClosedEvent { createdAt closer { ... on PullRequest { number baseRefName mergedAt } } } }
        pageInfo { hasPreviousPage startCursor }
      } } }
    }`, { id: issueNodeId, before });
    const timeline = node?.timelineItems;
    if (!timeline) throw new Error('GitHub não retornou os eventos de fechamento da Issue.');
    const closedAtInstant = Date.parse(closedAt);
    const closingEvent = timeline.nodes.find(event => Date.parse(event.createdAt) === closedAtInstant);
    if (closingEvent) {
      const closer = closingEvent.closer;
      return closer?.baseRefName === 'develop' && Boolean(closer.mergedAt);
    }
    before = timeline.pageInfo.hasPreviousPage ? timeline.pageInfo.startCursor : null;
  } while (before);
  return false;
}
