// Spec 0014: o status da spec na branch feature/<spec>-issue-<n>-<slug> sinaliza Ready.
const FEATURE_BRANCH = /^feature\/(\d{4})-issue-([1-9]\d*)-.+$/;
const SPEC_STATUSES = new Set(['rascunho', 'pronta', 'implementada', 'descartada']);

function parseFeatureBranch(name) {
  const match = FEATURE_BRANCH.exec(name || '');
  return match ? { spec: match[1], issue: Number(match[2]) } : null;
}

function parseSpecStatus(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/);
  if (lines[0].trim() !== '---') return { error: 'cabeçalho ausente' };
  const end = lines.findIndex((line, index) => index > 0 && line.trim() === '---');
  if (end < 0) return { error: 'cabeçalho sem fechamento' };
  const field = lines.slice(1, end).map(line => /^status:(.*)$/.exec(line)).find(Boolean);
  const status = field ? field[1].replace(/#.*$/, '').trim().replace(/^(["'])(.*)\1$/, '$2') : '';
  if (!SPEC_STATUSES.has(status)) return { error: `status '${status || '(ausente)'}' inválido` };
  return { status };
}

function specChanged(files, spec) {
  const path = new RegExp(`^specs/${spec}-[^/]+/spec\\.md$`);
  return files.some(file => path.test(file.filename));
}

// Lê no SHA atual da branch: execuções fora de ordem convergem para o estado mais recente.
async function readBranchSpec(github, repo, branch, spec) {
  const sha = await currentSha(github, repo, branch);
  if (!sha) return { branch, status: null };
  const entries = await content(github, repo, 'specs', sha);
  const dirs = (entries || []).filter(entry => entry.type === 'dir' && entry.name.startsWith(`${spec}-`));
  if (dirs.length === 0) return { branch, status: null };
  if (dirs.length > 1) return { branch, error: `mais de uma pasta specs/${spec}-*` };
  const file = await content(github, repo, `specs/${dirs[0].name}/spec.md`, sha);
  if (!file) return { branch, status: null };
  // Acima de 1 MB a API devolve encoding 'none' sem conteúdo.
  if (file.encoding !== 'base64') return { branch, error: 'spec.md grande demais para leitura pela API' };
  const parsed = parseSpecStatus(Buffer.from(file.content, file.encoding).toString('utf8'));
  return parsed.error ? { branch, error: parsed.error } : { branch, status: parsed.status };
}

async function issueSpecState(github, repo, issue) {
  const refs = await github.paginate(github.rest.git.listMatchingRefs, { ...repo, ref: 'heads/feature/' });
  const branches = refs
    .map(ref => ref.ref.replace(/^refs\/heads\//, ''))
    .map(name => ({ name, link: parseFeatureBranch(name) }))
    .filter(branch => branch.link?.issue === issue);
  const results = [];
  for (const branch of branches) results.push(await readBranchSpec(github, repo, branch.name, branch.link.spec));
  return {
    ready: results.some(result => result.status === 'pronta'),
    warnings: results.filter(result => result.error).map(result => `${result.branch}: ${result.error}`),
  };
}

async function currentSha(github, repo, branch) {
  try {
    const { data } = await github.rest.git.getRef({ ...repo, ref: `heads/${branch}` });
    return data.object.sha;
  } catch (error) {
    if (error.status === 404) return null; // branch removida entre a listagem e a leitura
    throw error;
  }
}

async function content(github, repo, path, ref) {
  try {
    return (await github.rest.repos.getContent({ ...repo, path, ref })).data;
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

module.exports = { parseFeatureBranch, parseSpecStatus, specChanged, issueSpecState };
