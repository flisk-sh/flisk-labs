import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'yaml';

const root = path.resolve(import.meta.dirname, '..');

test('canonical URL in _config.yml matches CNAME custom domain', () => {
  const cnamePath = path.join(root, 'CNAME');
  assert.ok(fs.existsSync(cnamePath), 'CNAME file must exist');
  const cname = fs.readFileSync(cnamePath, 'utf8').trim();

  const configPath = path.join(root, '_config.yml');
  assert.ok(fs.existsSync(configPath), '_config.yml must exist');
  const config = yaml.parse(fs.readFileSync(configPath, 'utf8'));

  assert.equal(config.url, `https://${cname}`, 'site url must match https://<CNAME>');
  assert.equal(config.baseurl, '', 'baseurl must be empty when served from a custom domain');
});

test('no stale flisk.sh/flisk-labs or tdk-labs URLs exist in config, layouts, or data', () => {
  const targetDirsOrFiles = [
    path.join(root, '_config.yml'),
    path.join(root, 'CNAME'),
    path.join(root, '_layouts'),
    path.join(root, '_includes'),
    path.join(root, '_data')
  ];

  const stalePatterns = [
    /flisk\.sh\/flisk-labs/i,
    /tdk-labs/i
  ];

  function checkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    for (const pattern of stalePatterns) {
      assert.ok(
        !pattern.test(content),
        `Found stale pattern ${pattern} in ${path.relative(root, filePath)}`
      );
    }
  }

  function checkTarget(targetPath) {
    if (!fs.existsSync(targetPath)) return;
    const stat = fs.statSync(targetPath);
    if (stat.isDirectory()) {
      const entries = fs.readdirSync(targetPath, { withFileTypes: true });
      for (const entry of entries) {
        checkTarget(path.join(targetPath, entry.name));
      }
    } else if (stat.isFile()) {
      checkFile(targetPath);
    }
  }

  for (const target of targetDirsOrFiles) {
    checkTarget(target);
  }
});
