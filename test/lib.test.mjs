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
