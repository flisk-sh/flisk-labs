import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { root, labDir } from '../scripts/lib.mjs';

test('validate-content succeeds on valid repository content', () => {
  const result = spawnSync(process.execPath, [path.join(root, 'scripts/validate-content.mjs')], {
    cwd: root,
    encoding: 'utf8'
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Validated \d+ labs and \d+ tracks\./);
});

test('validate-content fails when a lab YAML is missing required schema fields', (t) => {
  const fixturePath = path.join(labDir, '99-broken-fixture.yaml');
  // Lab missing required schema fields (e.g. title, track, etc.)
  fs.writeFileSync(fixturePath, 'id: 99-broken-fixture\nmode: replay\n');
  t.after(() => {
    if (fs.existsSync(fixturePath)) {
      fs.unlinkSync(fixturePath);
    }
  });

  const result = spawnSync(process.execPath, [path.join(root, 'scripts/validate-content.mjs')], {
    cwd: root,
    encoding: 'utf8'
  });

  assert.notEqual(result.status, 0, 'validate-content must exit non-zero for broken lab');
  assert.match(result.stderr, /99-broken-fixture\.yaml: missing title/);
  assert.match(result.stderr, /content issue\(s\)/);
});
