import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const workflowDirectory = new URL('../../workflows/', import.meta.url);
const trigger = readFileSync(fileURLToPath(new URL('discord-pr-trigger.yml', workflowDirectory)), 'utf8');
const publisher = readFileSync(fileURLToPath(new URL('discord-pr-publish.yml', workflowDirectory)), 'utf8');

test('el disparador escucha solo PR a staging sin permisos ni código de la PR', () => {
  assert.match(trigger, /pull_request:\s*\n\s*branches:\s*\[staging\]/);
  assert.match(trigger, /types:\s*\[opened, review_requested, ready_for_review\]/);
  assert.match(trigger, /permissions:\s*\{\}/);
  assert.doesNotMatch(trigger, /actions\/checkout|secrets\.|pull_request_target/);
  assert.match(trigger, /PR_NUMBER:\s*\$\{\{\s*github\.event\.pull_request\.number\s*\}\}/);
  assert.match(trigger, /retention-days:\s*1/);
});

test('el emisor acepta solo workflow_run exitoso en main y usa entorno protegido', () => {
  assert.match(publisher, /workflow_run:\s*\n\s*workflows:\s*\[Discord PR notification trigger\]/);
  assert.match(publisher, /types:\s*\[completed\]/);
  assert.match(publisher, /github\.ref == 'refs\/heads\/main'/);
  assert.match(publisher, /workflow_run\.conclusion == 'success'/);
  assert.match(publisher, /workflow_run\.event == 'pull_request'/);
  assert.match(publisher, /workflow_run\.repository\.full_name == github\.repository/);
  assert.match(publisher, /environment:\s*discord-pr-notifications/);
  assert.match(publisher, /cancel-in-progress:\s*false/);
  assert.match(publisher, /queue:\s*max/);
});

test('el emisor lee el artefacto del run y ejecuta el verificador desde main', () => {
  assert.match(publisher, /actions\/checkout@[a-f0-9]{40}/);
  assert.match(publisher, /ref:\s*\$\{\{\s*github\.sha\s*\}\}/);
  assert.match(publisher, /persist-credentials:\s*false/);
  assert.match(publisher, /actions\/download-artifact@[a-f0-9]{40}/);
  assert.match(publisher, /run-id:\s*\$\{\{\s*github\.event\.workflow_run\.id\s*\}\}/);
  assert.match(publisher, /run:\s*node \.github\/scripts\/discord-pr-notifications\/verify-event\.mjs/);
  assert.match(publisher, /actions:\s*read/);
  assert.match(publisher, /contents:\s*read/);
  assert.match(publisher, /pull-requests:\s*read/);
  assert.doesNotMatch(publisher, /ref:\s*\$\{\{\s*github\.event\.workflow_run\.head_sha/);
  assert.deepEqual([...publisher.matchAll(/secrets\.([A-Z_]+)/g)].map((match) => match[1]), [
    'DISCORD_CACHE_KEY',
    'DISCORD_BOT_TOKEN',
    'DISCORD_CACHE_KEY',
  ]);
});

test('dos PR distintas serializan el acceso al artefacto compartido', () => {
  // La caché se descarga y se sube en cada ejecución; todas deben compartir el grupo.
  assert.match(publisher, /concurrency:\s*\n\s*group:\s*discord-pr-relations\s*\n\s*queue:\s*max\s*\n\s*cancel-in-progress:\s*false/);
});

test('el emisor conserva relaciones cifradas durante dos días', () => {
  assert.match(publisher, /DISCORD_CACHE_KEY:\s*\$\{\{\s*secrets\.DISCORD_CACHE_KEY\s*\}\}/);
  assert.match(publisher, /run:\s*node \.github\/scripts\/discord-pr-notifications\/state\.mjs prepare/);
  assert.match(publisher, /run:\s*node \.github\/scripts\/discord-pr-notifications\/notify\.mjs/);
  assert.match(publisher, /if: always\(\) && steps\.prepare\.outcome == 'success'/);
  assert.match(publisher, /path:\s*current-relations\/relations\.enc\.json/);
  assert.match(publisher, /retention-days:\s*2/);
});
