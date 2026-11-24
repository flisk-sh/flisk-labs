import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../scripts/capture-lab.mjs', import.meta.url));

for (const { failure, status, message } of [
  { failure: 'image', status: 42, message: /Docker capture image unavailable or failed/ },
  { failure: 'step', status: 43, message: /01-sample\/example failed/ },
  { failure: '', status: 0, message: /capture matches/ },
]) {
  test(`capture removes its workspace after ${failure || 'success'}`, (t) => {
    const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'flisk-capture-test-'));
    t.after(() => fs.rmSync(fixture, { recursive: true, force: true }));
    const bin = path.join(fixture, 'bin');
    const tmp = path.join(fixture, 'tmp');
    const labs = path.join(fixture, 'labs');
    for (const dir of [bin, tmp, labs]) fs.mkdirSync(dir);
    fs.writeFileSync(path.join(labs, '01-sample.yaml'), `
cli_version: '1.2.3'
steps:
  - id: example
    cmd: echo hello
    out: hello
`);
    fs.writeFileSync(path.join(bin, 'docker'), `#!/bin/sh
for arg in "$@"; do command=$arg; done
case "$command" in
  "echo hello") if [ "$CAPTURE_TEST_FAILURE" = step ]; then exit 43; fi; printf 'hello\\n' ;;
  *) if [ "$CAPTURE_TEST_FAILURE" = image ]; then exit 42; fi ;;
esac
`, { mode: 0o755 });
    const result = spawnSync(process.execPath, [script, '01-sample'], {
      encoding: 'utf8',
      env: {
        ...process.env,
        TMPDIR: tmp,
        PATH: `${bin}${path.delimiter}${process.env.PATH}`,
        FLISK_CAPTURE_CONTENT_DIR: fixture,
        CAPTURE_TEST_FAILURE: failure,
      },
    });
    assert.equal(result.status, status, result.stderr);
    assert.match(status ? result.stderr : result.stdout, message);
    assert.deepEqual(fs.readdirSync(tmp), []);
  });
}
