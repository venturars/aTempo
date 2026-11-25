import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { notifyReviewers, logReviewerProblems } from '../../.github/actions/discord-pr-notifications/notify.mjs';
import { writeRelations } from '../../.github/actions/discord-pr-notifications/state.mjs';

const REPOSITORY = 'owner/repo';
const NUMBER = 7;
const GUILD_ID = '111111111111111111';
const CHANNEL_ID = '222222222222222222';
const ALICE_DISCORD_ID = '333333333333333333';
const CAROL_DISCORD_ID = '444444444444444444';
const GITHUB_TOKEN = 'test-github-token-value';
const BOT_TOKEN = 'test-bot-token-value';
// 32 bytes en base64, como exige el estado cifrado.
const CACHE_KEY = Buffer.alloc(32, 7).toString('base64');

const originalFetch = globalThis.fetch;
const originalConsoleLog = console.log;
const originalRepositoryEnv = process.env.GITHUB_REPOSITORY;
let workDirectory;
let logLines;
let discordMessages;

function jsonResponse(body) {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
}

function pullRequestWith(reviewers) {
  return {
    number: NUMBER,
    state: 'open',
    draft: false,
    title: 'Test PR',
    base: { ref: 'main', repo: { full_name: REPOSITORY } },
    head: { sha: 'a'.repeat(40) },
    requested_reviewers: reviewers,
  };
}

// Responde solo a las URL que notifyReviewers llama; cualquier otra hace fallar el test.
function installFetchDouble({ reviewers, discordMembersById, searchResults = [] }) {
  globalThis.fetch = async (url, options = {}) => {
    const method = options.method ?? 'GET';
    const { hostname, pathname } = new URL(url);
    if (hostname === 'api.github.com') {
      if (pathname === `/repos/${REPOSITORY}/pulls/${NUMBER}`) return jsonResponse(pullRequestWith(reviewers));
      if (pathname === `/repos/${REPOSITORY}/issues/${NUMBER}/comments` && method === 'GET') return jsonResponse([]);
      if (pathname === `/repos/${REPOSITORY}/issues/${NUMBER}/comments` && method === 'POST') return jsonResponse({});
    }
    if (hostname === 'discord.com') {
      const memberMatch = pathname.match(/\/guilds\/\d+\/members\/(\d+)$/);
      if (memberMatch) {
        const member = discordMembersById[memberMatch[1]];
        return member ? jsonResponse(member) : new Response('{}', { status: 404 });
      }
      if (pathname.endsWith('/members/search')) return jsonResponse(searchResults);
      if (pathname === `/api/v10/channels/${CHANNEL_ID}/messages` && method === 'POST') {
        discordMessages.push(JSON.parse(options.body));
        return jsonResponse({});
      }
    }
    throw new Error(`Unexpected request: ${method} ${url}`);
  };
}

function configFor(userMap) {
  return {
    repository: REPOSITORY,
    baseBranch: 'main',
    number: NUMBER,
    githubToken: GITHUB_TOKEN,
    botToken: BOT_TOKEN,
    cacheKey: CACHE_KEY,
    guildId: GUILD_ID,
    channelId: CHANNEL_ID,
    relationsFile: join(workDirectory, 'relations.enc.json'),
    userMap: JSON.stringify(userMap),
    minimumReviewers: '2',
  };
}

const alice = { login: 'alice', id: 1 };
const bob = { login: 'bob', id: 2 };
const carol = { login: 'carol', id: 3 };
const memberById = {
  [ALICE_DISCORD_ID]: { user: { id: ALICE_DISCORD_ID } },
  [CAROL_DISCORD_ID]: { user: { id: CAROL_DISCORD_ID } },
};

beforeEach(() => {
  workDirectory = mkdtempSync(join(tmpdir(), 'notify-test-'));
  writeRelations(join(workDirectory, 'relations.enc.json'), [], CACHE_KEY);
  logLines = [];
  discordMessages = [];
  delete process.env.GITHUB_REPOSITORY;
  console.log = (...parts) => logLines.push(parts.join(' '));
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  console.log = originalConsoleLog;
  if (originalRepositoryEnv === undefined) delete process.env.GITHUB_REPOSITORY;
  else process.env.GITHUB_REPOSITORY = originalRepositoryEnv;
  rmSync(workDirectory, { recursive: true, force: true });
});

test('logs the login and reason of a reviewer without Discord mention', async () => {
  installFetchDouble({ reviewers: [alice, bob], discordMembersById: memberById });

  const outcome = await notifyReviewers(configFor({ alice: ALICE_DISCORD_ID }));

  assert.equal(outcome, 'notified');
  const problemLines = logLines.filter((line) => line.startsWith('Reviewer without Discord mention'));
  assert.deepEqual(problemLines, ['Reviewer without Discord mention: bob: no unique exact match']);
  assert.equal(discordMessages.length, 1);
  assert.match(discordMessages[0].content, /bob \(sin mención de Discord\)/);
  assert.match(discordMessages[0].content, new RegExp(`<@${ALICE_DISCORD_ID}>`));
});

test('does not log Discord IDs or tokens', async () => {
  installFetchDouble({ reviewers: [alice, bob], discordMembersById: memberById });

  await notifyReviewers(configFor({ alice: ALICE_DISCORD_ID }));

  assert.ok(logLines.length > 0);
  for (const line of logLines) {
    for (const secret of [ALICE_DISCORD_ID, GITHUB_TOKEN, BOT_TOKEN, CACHE_KEY, 'githubToken', 'botToken', 'cacheKey']) {
      assert.ok(!line.includes(secret), `a log line contains ${secret === ALICE_DISCORD_ID ? 'a Discord ID' : secret.slice(0, 8)}`);
    }
  }
});

test('logs nothing when every reviewer resolves', async () => {
  installFetchDouble({ reviewers: [alice, carol], discordMembersById: memberById });

  await notifyReviewers(configFor({ alice: ALICE_DISCORD_ID, carol: CAROL_DISCORD_ID }));

  assert.deepEqual(logLines.filter((line) => line.startsWith('Reviewer without Discord mention')), []);
  assert.match(discordMessages[0].content, new RegExp(`<@${ALICE_DISCORD_ID}>`));
  assert.match(discordMessages[0].content, new RegExp(`<@${CAROL_DISCORD_ID}>`));
});

test('logs the duplicate Discord user reason without IDs', async () => {
  installFetchDouble({ reviewers: [alice, carol], discordMembersById: memberById });

  await notifyReviewers(configFor({ alice: ALICE_DISCORD_ID, carol: ALICE_DISCORD_ID }));

  const problemLines = logLines.filter((line) => line.startsWith('Reviewer without Discord mention'));
  assert.deepEqual(problemLines, ['Reviewer without Discord mention: alice, carol: multiple reviewers resolve to the same Discord user']);
  assert.ok(logLines.every((line) => !line.includes(ALICE_DISCORD_ID)));
  assert.match(discordMessages[0].content, /sin mención de Discord/);
});

test('logReviewerProblems writes one line per problem and nothing for an empty list', () => {
  const lines = [];
  logReviewerProblems([], (line) => lines.push(line));
  assert.deepEqual(lines, []);

  logReviewerProblems(['a: no unique exact match', 'b: confirmation is not a unique guild member'], (line) => lines.push(line));
  assert.equal(lines.length, 2);
});

test('logReviewerProblems keeps a login with control characters on a single line', () => {
  const lines = [];
  logReviewerProblems(['evil\nlogin\r\u0007x: no unique exact match'], (line) => lines.push(line));
  assert.equal(lines.length, 1);
  assert.ok(!/[\u0000-\u001f\u007f]/.test(lines[0]));
});
