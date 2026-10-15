const RELEASE_TAG = /^v(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/;

function resolveRelease({ eventName, ref, inputVersion = '', sha, stageSha, tagSha }) {
  if (!['push', 'workflow_dispatch'].includes(eventName)) {
    throw new Error(`evento '${eventName || '(ausente)'}' não suportado para release.`);
  }
  if (eventName === 'push' && !ref?.startsWith('refs/tags/')) {
    throw new Error('Evento push precisa apontar para uma tag de release.');
  }
  if (eventName === 'workflow_dispatch' && ref !== 'refs/heads/stage') {
    throw new Error('Execução manual de release só é aceita na branch stage.');
  }

  const tag = eventName === 'push' ? ref.slice('refs/tags/'.length) : inputVersion;
  if (!RELEASE_TAG.test(tag || '')) {
    throw new Error('Tag deve seguir vMAJOR.MINOR.PATCH sem prerelease ou metadados.');
  }
  if (!sha || !tagSha || tagSha !== sha) {
    throw new Error('A tag de release deve apontar para o SHA desta execução.');
  }
  if (!stageSha || stageSha !== sha) {
    throw new Error('O SHA da release deve ser exatamente a ponta atual de stage.');
  }
  return tag;
}

async function resolveTagCommitSha(github, repo, tag) {
  const { data: ref } = await github.rest.git.getRef({ ...repo, ref: `tags/${tag}` });
  let target = ref.object;
  for (let depth = 0; target.type === 'tag' && depth < 8; depth += 1) {
    ({ data: target } = await github.rest.git.getTag({ ...repo, tag_sha: target.sha }));
    target = target.object;
  }
  if (target.type !== 'commit' || !target.sha) {
    throw new Error(`A tag '${tag}' não resolve para um commit.`);
  }
  return target.sha;
}

module.exports = { RELEASE_TAG, resolveRelease, resolveTagCommitSha };
