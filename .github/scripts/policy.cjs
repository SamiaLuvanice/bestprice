function closingIssue(body = '') {
  const lines = body.replace(/<!--[\s\S]*?-->/g, '').split(/\r?\n/);
  const visible = [];
  let fence = null;
  for (const line of lines) {
    const marker = line.trim().match(/^(`{3,}|~{3,})/);
    if (marker) {
      const kind = marker[1][0];
      if (fence === null) fence = kind;
      else if (fence === kind) fence = null;
      continue;
    }
    if (fence === null) visible.push(line);
  }
  const text = visible.join('\n');
  const matches = [...text.matchAll(/^(?:Closes|Fixes|Resolves) #([1-9]\d*)\s*$/gim)];
  if (matches.length !== 1) throw new Error('Declare exatamente uma Issue em linha própria: Closes #123.');
  return Number(matches[0][1]);
}

function validatePullRequest(pr) {
  const base = pr.base.ref;
  const source = pr.head.ref;
  if (base === 'stage' || base === 'main' || (base === 'develop' && source === 'stage')) {
    const expected = base === 'stage' ? ['develop', 'main'] : ['stage'];
    if (!expected.includes(source)) throw new Error(`Promoção/sincronização para ${base} deve partir de ${expected.join(' ou ')}.`);
    if (pr.head.repo?.full_name !== pr.base.repo.full_name) throw new Error('Promoção/sincronização exige o mesmo repositório.');
    return null;
  }
  if (base !== 'develop') throw new Error('Tarefas devem ter develop como base.');
  const match = source.match(/^(?:feature|fix|chore|docs)\/(?:\d{4}-)?issue-([1-9]\d*)-[a-z0-9]+(?:-[a-z0-9]+)*$/);
  if (!match) throw new Error('Branch deve seguir feature/0006-issue-123-descricao (ou fix/chore/docs).');
  const issue = closingIssue(pr.body || '');
  if (Number(match[1]) !== issue) throw new Error('Issue da branch difere do Closes na PR.');
  return issue;
}

async function checkPullRequest({ github, context }) {
  const pr = context.payload.pull_request;
  const issueNumber = validatePullRequest(pr);
  if (issueNumber === null) return;
  const { data: issue } = await github.rest.issues.get({ ...context.repo, issue_number: issueNumber });
  if (issue.pull_request || issue.state !== 'open') throw new Error('A referência deve ser uma Issue aberta deste repositório.');
  const { data: details } = await github.rest.pulls.get({ ...context.repo, pull_number: pr.number });
  if (details.commits > 250) throw new Error('PR com mais de 250 commits não pode ser validada automaticamente; divida a PR.');
  const commits = await github.paginate(github.rest.pulls.listCommits, { ...context.repo, pull_number: pr.number, per_page: 100 });
  const reference = new RegExp(`(?:Refs|Closes|Fixes|Resolves) #${issueNumber}(?![0-9])`, 'i');
  for (const commit of commits) {
    if (commit.parents.length > 1) continue; // atualização legítima da branch a partir de develop
    if (!reference.test(commit.commit.message)) throw new Error(`Commit ${commit.sha.slice(0, 7)} precisa de Refs #${issueNumber}.`);
  }
}

module.exports = { validatePullRequest, closingIssue, checkPullRequest };
