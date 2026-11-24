import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const UPLOAD_ARTIFACT_SHA = 'ea165f8d65b6e75b540449e92b4886f43607fa02';
const workflowsFolder = new URL('../workflows/', import.meta.url);

function readWorkflow(fileName) {
  return readFileSync(new URL(fileName, workflowsFolder), 'utf8');
}

// Devuelve el texto de un paso del job: desde su línea «- ...» hasta la del siguiente paso.
function readStepBlock(workflow, startMarker) {
  const lines = workflow.split('\n');
  const start = lines.findIndex((line) => line.includes(startMarker));
  assert.notEqual(start, -1, `No se encuentra el paso ${startMarker}`);
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^      - /.test(lines[index])) {
      end = index;
      break;
    }
  }
  return lines.slice(start, end).join('\n');
}

// Misma validación que readPrNumber de verify-event.mjs.
function passesReadPrNumberChecks(filePath) {
  const sizeIsValid = statSync(filePath).size <= 10;
  const content = readFileSync(filePath, 'utf8');
  return sizeIsValid && /^[1-9][0-9]{0,9}$/.test(content);
}

function extractSaveCommand(workflow) {
  const block = readStepBlock(workflow, 'name: Guardar el número de la pull request');
  const lines = block.split('\n');
  const runIndex = lines.findIndex((line) => line.trim() === 'run: |');
  assert.notEqual(runIndex, -1, 'El paso de guardado no tiene run');
  return lines.slice(runIndex + 1).map((line) => line.trim()).filter(Boolean).join('\n');
}

function runSaveCommand(prNumber) {
  const workFolder = mkdtempSync(join(tmpdir(), 'pr-check-rules-'));
  execFileSync('sh', ['-c', extractSaveCommand(readWorkflow('pr-check-rules.yml'))], {
    cwd: workFolder,
    env: { ...process.env, PR_NUMBER: String(prNumber) },
  });
  return join(workFolder, 'pr-event', 'pr-number');
}

test('sube el artefacto discord-pr-number con pr-number', () => {
  const workflow = readWorkflow('pr-check-rules.yml');
  const saveStep = readStepBlock(workflow, 'name: Guardar el número de la pull request');
  assert.match(saveStep, /PR_NUMBER: \$\{\{ github\.event\.pull_request\.number \}\}/);
  assert.match(saveStep, /printf '%s' "\$PR_NUMBER" > pr-event\/pr-number/);
  assert.doesNotMatch(saveStep, /run:[\s\S]*\$\{\{/, 'El número no se interpola en el script');

  const uploadStep = readStepBlock(workflow, `actions/upload-artifact@${UPLOAD_ARTIFACT_SHA}`);
  assert.match(uploadStep, /name: discord-pr-number/);
  assert.match(uploadStep, /path: pr-event\/pr-number/);
  assert.match(uploadStep, /retention-days: 1/);
  assert.doesNotMatch(uploadStep, /if-no-files-found:\s*(warn|ignore)/);
});

test('el fichero pasa las validaciones de readPrNumber', () => {
  for (const prNumber of [218, 1, 9999999999]) {
    const filePath = runSaveCommand(prNumber);
    assert.equal(readFileSync(filePath, 'utf8'), String(prNumber));
    assert.ok(passesReadPrNumberChecks(filePath), `PR ${prNumber} rechazada`);
  }
});

test('el job sigue condicionado a PR fuera de draft', () => {
  const workflow = readWorkflow('pr-check-rules.yml');
  assert.match(workflow, /if: github\.event\.pull_request\.draft == false/);
});

test('la subida va después de la comprobación', () => {
  const workflow = readWorkflow('pr-check-rules.yml');
  const checkIndex = workflow.indexOf('name: Comprobar la pull request');
  const saveIndex = workflow.indexOf('name: Guardar el número de la pull request');
  const uploadIndex = workflow.indexOf(`actions/upload-artifact@${UPLOAD_ARTIFACT_SHA}`);
  assert.ok(checkIndex !== -1 && checkIndex < saveIndex && saveIndex < uploadIndex);
  const saveStep = readStepBlock(workflow, 'name: Guardar el número de la pull request');
  const uploadStep = readStepBlock(workflow, `actions/upload-artifact@${UPLOAD_ARTIFACT_SHA}`);
  assert.doesNotMatch(saveStep, /continue-on-error/);
  assert.doesNotMatch(uploadStep, /continue-on-error/);
});

test('la subida no depende de la condición del bot', () => {
  const workflow = readWorkflow('pr-check-rules.yml');
  const saveStep = readStepBlock(workflow, 'name: Guardar el número de la pull request');
  const uploadStep = readStepBlock(workflow, `actions/upload-artifact@${UPLOAD_ARTIFACT_SHA}`);
  assert.doesNotMatch(saveStep, /^\s+if:/m);
  assert.doesNotMatch(uploadStep, /^\s+if:/m);
  const checkStep = readStepBlock(workflow, 'name: Comprobar la pull request');
  assert.match(checkStep, /github-actions\[bot\]/);
  assert.match(checkStep, /chore\/update-delivery-workflow/);
});

test('discord-pr-confirmation-trigger.yml conserva su artefacto', () => {
  const workflow = readWorkflow('discord-pr-confirmation-trigger.yml');
  assert.match(workflow, /printf '%s' "\$PR_NUMBER" > pr-event\/pr-number/);
  const uploadStep = readStepBlock(workflow, `actions/upload-artifact@${UPLOAD_ARTIFACT_SHA}`);
  assert.match(uploadStep, /name: discord-pr-number/);
  assert.match(uploadStep, /path: pr-event\/pr-number/);
  assert.match(uploadStep, /retention-days: 1/);
});

test('solo pr-check-rules.yml sube el artefacto en eventos de PR', () => {
  const uploaders = readdirSync(workflowsFolder)
    .filter((fileName) => /\.ya?ml$/.test(fileName))
    .filter((fileName) => readWorkflow(fileName).includes('name: discord-pr-number'));
  assert.deepEqual(uploaders.sort(), ['discord-pr-confirmation-trigger.yml', 'pr-check-rules.yml']);

  const confirmation = readWorkflow('discord-pr-confirmation-trigger.yml');
  assert.match(confirmation, /issue_comment/);
  assert.doesNotMatch(confirmation, /^\s*pull_request(_target)?:/m);

  assert.ok(!readdirSync(workflowsFolder).includes('discord-pr-trigger.yml'));

  const publisher = readWorkflow('discord-pr-publish.yml');
  assert.match(publisher, /workflows: \[[^\]]*"PR: check rules"[^\]]*\]/);
});
