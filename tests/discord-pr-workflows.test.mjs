import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const workflow = readFileSync(new URL('../.github/workflows/discord-pr-notifications.yml', import.meta.url), 'utf8');
const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');

test('el workflow confiable de main escucha PR hacia staging y asociaciones', () => {
  assert.match(workflow, /pull_request_target:\s*\n\s+branches: \[staging\]/);
  assert.match(workflow, /types: \[opened, review_requested, ready_for_review\]/);
  assert.match(workflow, /issue_comment:\s*\n\s+types: \[created, edited\]/);
  assert.match(workflow, /github\.ref == 'refs\/heads\/main'/);
  assert.match(workflow, /github\.repository == 'venturars\/aTempo'/);
  assert.match(workflow, /github\.event\.pull_request\.base\.ref == 'staging'/);
  assert.match(workflow, /github\.event\.issue\.pull_request/);
  assert.match(workflow, /startsWith\(github\.event\.comment\.body, '\/discord-map '\)/);
});

test('el emisor usa el entorno protegido y solo la acción fijada del paquete', () => {
  assert.match(workflow, /environment: Discord-PR-Notifications/);
  assert.match(workflow, /group: discord-pr-relations[\s\S]*queue: max[\s\S]*cancel-in-progress: false/);
  assert.match(workflow, /permissions:\s*\n\s+actions: read\s*\n\s+contents: read\s*\n\s+issues: write\s*\n\s+pull-requests: read/);
  assert.match(workflow, /uses: venturars\/delivery-workflow\/\.github\/actions\/discord-pr-notifications@1fe1b22af187e0afa1470f9d5df435f7a202435b/);
  assert.match(workflow, /expected-repository: venturars\/aTempo/);
  assert.match(workflow, /base-branch: staging/);
  assert.match(workflow, /trusted-branch: main/);
  assert.match(workflow, /pr-number: \$\{\{ github\.event\.pull_request\.number \|\| github\.event\.issue\.number \}\}/);
  assert.match(workflow, /bot-token: \$\{\{ secrets\.DISCORD_BOT_TOKEN \}\}/);
  assert.match(workflow, /cache-key: \$\{\{ secrets\.DISCORD_CACHE_KEY \}\}/);
  assert.match(workflow, /guild-id: \$\{\{ vars\.DISCORD_GUILD_ID \}\}/);
  assert.match(workflow, /channel-id: \$\{\{ vars\.DISCORD_GIT_CHANNEL_ID \}\}/);
  assert.doesNotMatch(workflow, /actions\/checkout|trigger-run-id:|download-artifact|head\.sha/);
});

test('la documentación describe un aviso optativo sin pasos de agente', () => {
  assert.match(readme, /discord-pr-notifications\.yml/);
  assert.match(readme, /\/discord-map LOGIN_GITHUB ID_DISCORD/);
  assert.match(readme, /APM no instala este workflow/);
});
