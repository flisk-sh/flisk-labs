import fs from 'node:fs';
import path from 'node:path';
import yaml from 'yaml';
import { labNeighbours } from './lib.mjs';

const root = path.resolve(import.meta.dirname, '..');
const sourceDir = path.join(root, 'content/labs');
const routeRoot = path.join(root, 'labs');
const labFiles = fs.readdirSync(sourceDir).filter((name) => name.endsWith('.yaml')).sort();
const labs = labFiles.map((file) => ({ file, lab: yaml.parse(fs.readFileSync(path.join(sourceDir, file), 'utf8')) }));
const titles = new Map(labs.map(({ lab }) => [lab.id, lab.title]));
const neighbours = labNeighbours(yaml.parse(fs.readFileSync(path.join(root, 'content/tracks.yaml'), 'utf8')));
const link = (id) => (id && titles.has(id) ? { id, title: titles.get(id) } : null);

for (const { file, lab } of labs) {
  const routeDir = path.join(routeRoot, lab.id);
  fs.mkdirSync(routeDir, { recursive: true });
  const near = neighbours.get(lab.id) ?? {};
  const page = {
    ...lab,
    layout: lab.mode === 'guide' ? 'guide' : 'lab',
    lab_id: lab.id,
    description: lab.goal ?? lab.steps[0]?.explain ?? `Step through ${lab.title}.`,
    permalink: `/labs/${lab.id}/`,
    prev_lab: link(near.prev),
    next_lab: link(near.next)
  };
  const frontMatter = yaml.stringify(page).trimEnd();
  fs.writeFileSync(path.join(routeDir, 'index.html'), `---\n${frontMatter}\n---\n<!-- Generated from content/labs/${file}. -->\n`);
}
console.log(`Generated ${labFiles.length} Jekyll lab routes.`);
