import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

test('Pages workflow caches Bundler dependencies from Gemfile.lock', () => {
  const workflow = parse(readFileSync(new URL('../.github/workflows/pages.yml', import.meta.url), 'utf8'));
  const rubySetup = workflow.jobs.build.steps.find((step) => step.uses === 'ruby/setup-ruby@v1');

  assert.ok(rubySetup, 'workflow configures Ruby');
  assert.equal(rubySetup.with['bundler-cache'], true);
  assert.equal(workflow.jobs.build.steps.some((step) => step.run === 'bundle install'), false);
});
