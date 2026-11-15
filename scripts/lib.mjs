import fs from 'node:fs';
import path from 'node:path';
import yaml from 'yaml';

export const root = path.resolve(import.meta.dirname, '..');
export const labDir = path.join(root, 'content/labs');
export function readYaml(file) { return yaml.parse(fs.readFileSync(file, 'utf8')); }
export function readLabs() {
  return fs.readdirSync(labDir).filter((name) => name.endsWith('.yaml')).sort().map((name) => ({ file: path.join(labDir, name), data: readYaml(path.join(labDir, name)) }));
}
// A guide lab is one the reader runs on their own machine. It has no captured transcript, so it must not carry one:
// each step says what to do, the command that checks it, and what a pass looks like in words.
export const guideLabKeys = ['id', 'title', 'track', 'level', 'duration_min', 'mode', 'goal', 'build', 'needs', 'docs', 'steps'];
export const guideStepKeys = ['id', 'task', 'cmd', 'expect', 'files'];
export function guideProblems(lab) {
  const problems = [];
  for (const key of guideLabKeys) if (lab?.[key] === undefined) problems.push(`missing ${key}`);
  if (lab?.capture_verified !== undefined) problems.push('a guide lab has no capture, remove capture_verified');
  if (!Array.isArray(lab?.needs) || !lab.needs.length) problems.push('needs must list at least one thing');
  for (const doc of Array.isArray(lab?.docs) ? lab.docs : []) {
    if (!doc?.label || !/^https:\/\//.test(doc?.url ?? '')) problems.push(`docs entries need a label and an https url (found ${JSON.stringify(doc)})`);
  }
  if (!Array.isArray(lab?.steps) || !lab.steps.length) { problems.push('steps must contain at least one step'); return problems; }
  const seen = new Set();
  for (const [index, step] of lab.steps.entries()) {
    for (const key of guideStepKeys) if (step?.[key] === undefined) problems.push(`step ${index + 1} missing ${key}`);
    if (step?.out) problems.push(`step ${step.id} has out: a guide lab shows no transcript, describe the pass in expect`);
    if (seen.has(step?.id)) problems.push(`duplicate step id ${step.id}`);
    seen.add(step?.id);
    if (!Array.isArray(step?.files)) problems.push(`step ${step?.id} files must be an array`);
  }
  return problems;
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

// Previous and next lab for each lab, in course order: a course runs through
// its tracks in the order of content/tracks.yaml, so the last lab of one part
// leads to the first lab of the next part.
export function labNeighbours(tracks) {
  const byCourse = new Map();
  for (const track of tracks) {
    const key = track.course ?? track.id;
    byCourse.set(key, [...(byCourse.get(key) ?? []), ...(track.labs ?? [])]);
  }
  const neighbours = new Map();
  for (const ids of byCourse.values()) {
    ids.forEach((id, i) => neighbours.set(id, { prev: ids[i - 1] ?? null, next: ids[i + 1] ?? null }));
  }
  return neighbours;
}
