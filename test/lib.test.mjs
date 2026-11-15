import test from 'node:test';
import assert from 'node:assert/strict';
import fs, { readFile } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { readYaml, fail, captureProblem } from '../scripts/lib.mjs';


// this test readYaml() parses a valid YAML file
test('readYaml should parse a valid YAML file', (t) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'flisk-labs-'));
  t.after(() => fs.rmSync(tempDir, { recursive: true, force: true }));
  const filePath = path.join(tempDir, 'sample.yaml');
  fs.writeFileSync(filePath, 'name: Sample Lab\nlevel: beginner\n');
  const result = readYaml(filePath);
  assert.deepEqual(result, {
    name: 'Sample Lab',
    level: 'beginner'
  });
});

// this test readYaml() throws when file does not exist
test('readYaml should throw for a missing YAML file', (t) => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'flisk-labs-'));

  t.after(() => {
    fs.rmSync(tempDirectory, {recursive: true, force: true})
  })

  const fPath = path.join(tempDirectory, 'missing.yaml');

  assert.throws(() => readYaml(fPath), {
    code: 'ENOENT'
  });
});

// this test fail() logs an error and sets process.exitCode
test('fail should log an error and set exitCode to 1', (t) => {
  const originalExitCode = process.exitCode;
  const messages = [];
  t.mock.method(console, 'error', (message) => {
    messages.push(message);
  });
  try {
    process.exitCode = 0;
    fail('Test error');
    assert.equal(process.exitCode, 1);
    assert.deepEqual(messages, ['flisk-labs: Test error']);
  } finally {
    process.exitCode = originalExitCode;
  }
});

// capture_verified is only set by capture-lab.mjs --write, together with capture_source: docker
test('captureProblem rejects a verified capture that is not from docker', () => {
  assert.match(captureProblem({ capture_verified: true, capture_source: 'local-source' }), /capture_source: docker/);
  assert.match(captureProblem({ capture_verified: true }), /found none/);
});

test('captureProblem accepts docker captures and unverified labs', () => {
  assert.equal(captureProblem({ capture_verified: true, capture_source: 'docker' }), null);
  assert.equal(captureProblem({ capture_verified: false, capture_source: 'local-source' }), null);
});

const guide = () => ({
  id: '10-x', title: 'X', track: 'models', level: 'beginner', duration_min: 10, mode: 'guide', goal: 'g', build: 'b',
  needs: ['a laptop'], docs: [{ label: 'Docs', url: 'https://example.com' }],
  steps: [{ id: 'one', task: 'Do it', cmd: 'true', expect: 'It exits 0.', files: [] }]
});

test('guideProblems accepts a complete guide lab', async () => {
  const { guideProblems } = await import('../scripts/lib.mjs');
  assert.deepEqual(guideProblems(guide()), []);
});

test('guideProblems rejects a transcript, a capture flag and a step without a check', async () => {
  const { guideProblems } = await import('../scripts/lib.mjs');
  const lab = guide();
  lab.capture_verified = true;
  lab.steps[0].out = 'made-up output';
  lab.steps.push({ id: 'two', task: 'No check', files: [] });
  const problems = guideProblems(lab).join('\n');
  assert.match(problems, /remove capture_verified/);
  assert.match(problems, /shows no transcript/);
  assert.match(problems, /step 2 missing cmd/);
  assert.match(problems, /step 2 missing expect/);
});

test('guideProblems rejects a docs link that is not https', async () => {
  const { guideProblems } = await import('../scripts/lib.mjs');
  const lab = guide();
  lab.docs = [{ label: 'Docs', url: 'http://example.com' }];
  assert.match(guideProblems(lab).join('\n'), /https url/);
});

test('labNeighbours walks a course across its parts and stops at course ends', async () => {
  const { labNeighbours } = await import('../scripts/lib.mjs');
  const n = labNeighbours([
    { id: 'models', course: 'ai', labs: ['10-a', '11-b'] },
    { id: 'knowledge', course: 'ai', labs: ['20-c'] },
    { id: 'cli', course: 'flisk', labs: ['01-x', '02-y'] }
  ]);
  assert.deepEqual(n.get('10-a'), { prev: null, next: '11-b' });
  assert.deepEqual(n.get('11-b'), { prev: '10-a', next: '20-c' });
  assert.deepEqual(n.get('20-c'), { prev: '11-b', next: null });
  assert.deepEqual(n.get('01-x'), { prev: null, next: '02-y' });
});

test('labNeighbours keeps a lab shared by two parts in its first place', async () => {
  const { labNeighbours } = await import('../scripts/lib.mjs');
  const n = labNeighbours([
    { id: 'foundations', course: 'flisk', labs: ['01-x', '02-y', '03-z'] },
    { id: 'structure', course: 'flisk', labs: ['02-y', '03-z'] },
    { id: 'service', course: 'flisk', labs: ['03-z'] }
  ]);
  assert.deepEqual(n.get('02-y'), { prev: '01-x', next: '03-z' });
  assert.deepEqual(n.get('03-z'), { prev: '02-y', next: null });
});
