import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workflowsDirectory = new URL('../.github/workflows/', import.meta.url);

async function readWorkflow(fileName) {
  return readFile(new URL(fileName, workflowsDirectory), 'utf8');
}

test('PR trigger captures only a staging PR number without permissions or secrets', async () => {
  const workflow = await readWorkflow('discord-pr-trigger.yml');

  assert.match(workflow, /pull_request:\s*\n\s+branches: \[staging\]/);
  assert.match(workflow, /types: \[opened, review_requested, ready_for_review\]/);
  assert.match(workflow, /permissions: \{\}/);
  assert.match(workflow, /PR_NUMBER: \$\{\{ github\.event\.pull_request\.number \}\}/);
  assert.match(workflow, /name: discord-pr-number/);
  assert.match(workflow, /path: pr-event\/pr-number/);
  assert.doesNotMatch(workflow, /secrets\.|DISCORD_BOT_TOKEN|DISCORD_CACHE_KEY/);
});

test('mapping trigger accepts PR comments and forwards only the PR number', async () => {
  const workflow = await readWorkflow('discord-pr-confirmation-trigger.yml');

  assert.match(workflow, /issue_comment:\s*\n\s+types: \[created, edited\]/);
  assert.match(workflow, /permissions: \{\}/);
  assert.match(workflow, /github\.event\.issue\.pull_request/);
  assert.match(workflow, /startsWith\(github\.event\.comment\.body, '\/discord-map '\)/);
  assert.match(workflow, /PR_NUMBER: \$\{\{ github\.event\.issue\.number \}\}/);
  assert.match(workflow, /name: discord-pr-number/);
  assert.match(workflow, /path: pr-event\/pr-number/);
  assert.doesNotMatch(workflow, /secrets\.|DISCORD_BOT_TOKEN|DISCORD_CACHE_KEY/);
});

test('publisher is restricted to main and calls the published action in the protected environment', async () => {
  const workflow = await readWorkflow('discord-pr-publish.yml');

  assert.match(workflow, /workflow_run:/);
  assert.match(workflow, /workflows: \[Discord PR notification trigger, Discord PR confirmation trigger\]/);
  assert.match(workflow, /types: \[completed\]/);
  assert.match(workflow, /github\.ref == 'refs\/heads\/main'/);
  assert.match(workflow, /github\.event\.workflow_run\.conclusion == 'success'/);
  assert.match(workflow, /github\.event\.workflow_run\.repository\.full_name == github\.repository/);
  assert.match(workflow, /environment: Discord-PR-Notifications/);
  assert.match(workflow, /group: discord-pr-relations[\s\S]*queue: max[\s\S]*cancel-in-progress: false/);
  assert.match(workflow, /permissions:\s*\n\s+actions: read\s*\n\s+contents: read\s*\n\s+issues: write\s*\n\s+pull-requests: read/);
  assert.match(workflow, /actions\/checkout@11bd71901bbe5b1630ceea73d27597364c9af683/);
  assert.match(workflow, /ref: \$\{\{ github\.sha \}\}/);
  assert.match(workflow, /venturars\/delivery-workflow\/\.github\/actions\/discord-pr-notifications@fb228007744116fca6ace5d0dfe75efa1900b340/);
  assert.match(workflow, /expected-repository: venturars\/aTempo/);
  assert.match(workflow, /base-branch: staging/);
  assert.match(workflow, /trigger-run-id: \$\{\{ github\.event\.workflow_run\.id \}\}/);
  assert.match(workflow, /bot-token: \$\{\{ secrets\.DISCORD_BOT_TOKEN \}\}/);
  assert.match(workflow, /cache-key: \$\{\{ secrets\.DISCORD_CACHE_KEY \}\}/);
  assert.match(workflow, /guild-id: \$\{\{ vars\.DISCORD_GUILD_ID \}\}/);
  assert.match(workflow, /channel-id: \$\{\{ vars\.DISCORD_GIT_CHANNEL_ID \}\}/);
});
