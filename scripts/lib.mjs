import fs from 'node:fs';
import path from 'node:path';
import yaml from 'yaml';

export const root = path.resolve(import.meta.dirname, '..');
export const labDir = path.join(root, 'content/labs');
export function readYaml(file) { return yaml.parse(fs.readFileSync(file, 'utf8')); }
export function readLabs() {
  return fs.readdirSync(labDir).filter((name) => name.endsWith('.yaml')).sort().map((name) => ({ file: path.join(labDir, name), data: readYaml(path.join(labDir, name)) }));
}
export function fail(message) { console.error(`flisk-labs: ${message}`); process.exitCode = 1; }
// Only `capture-lab.mjs --write` sets capture_verified, and it writes capture_source: docker. A verified flag on any
// other source was set by hand, so readers could trust a transcript nobody captured.
export function captureProblem(lab) {
  if (lab?.capture_verified === true && lab.capture_source !== 'docker') {
    return `capture_verified: true requires capture_source: docker (found ${lab.capture_source === undefined ? 'none' : lab.capture_source}); only scripts/capture-lab.mjs --write sets both`;
  }
  return null;
}
