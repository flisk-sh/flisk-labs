# Practice & Learn AI

Free hands-on labs for AI engineering, by [Flisk](https://flisk.si). Live at <https://practice.flisk.si/>.

There are two courses:

| Course | Labs | What you get |
| --- | --- | --- |
| AI engineering | 26 labs in 5 parts | Call a model, give it your documents, build the harness around it, make it reliable, deliver it to a customer |
| Flisk CLI | 3 labs | Run a local stack with the Flisk CLI |

## The AI engineering course

One small business runs through the whole course: Parcel Desk, a courier whose customers email in refund claims. You build the assistant that handles them.

| Part | Labs | You can do this after |
| --- | --- | --- |
| 1. Talk to a model | 10 to 14 | Run a model locally, call one from code, compare models with numbers, give a model tools, get checked data back |
| 2. Give it knowledge | 20 to 24 | Search by meaning, answer from your documents with sources, measure retrieval, build a dataset, fine-tune a small model |
| 3. Build the harness | 30 to 34 | Add permissions, budgets and logs, write rules for a coding agent, build a tool server, add checks for generated code, run open models |
| 4. Make it reliable | 40 to 45 | Grade with a checked judge, trace every step, add memory, survive restarts, run work in parallel, improve safely |
| 5. Deliver to a customer | 50 to 54 | Pick the use case, attack your own assistant, control every tool call, ship it, hand it over |

Most labs run on a laptop with free models. Each lab lists what it needs.

## Two kinds of lab

**Hands-on labs** (`mode: guide`) are the AI course. Each step has a task, a command that checks your work, and what you should see when it passes. You write the code. The page shows no output, because your output depends on your model and your machine.

**Replay labs** (`mode: replay`) are the Flisk CLI course. They show output captured from a real run. Browser replay is static: it does not run Flisk or start Docker.

## Add a hands-on lab

Create `content/labs/NN-name.yaml` and add its id to a part in `content/tracks.yaml`:

```yaml
id: 15-my-lab
title: A short title
track: models
level: beginner          # beginner, intermediate or advanced
duration_min: 30
mode: guide
goal: One sentence on what the learner can do afterwards.
build: What exists on their disk at the end.
needs:
  - Python 3.11 or newer and uv
docs:
  - label: Ollama docs
    url: https://docs.ollama.com
steps:
  - id: first
    task: What to do
    explain: Optional. Why it matters.
    cmd: the command that checks the work
    expect: What the learner sees when it passes.
    files:
      - file-they-write.py
```

Rules the validator enforces: every step has a check command and a pass description, links are https, and a hands-on lab has no transcript (`out`) and no `capture_verified`.

## Local development

Requirements: Node.js 22+, Ruby 3.4+, Bundler 2.6+, and npm.

```sh
npm ci
bundle install
npm run sync:catalog
npm run sync:content
npm run generate:pages
npm run validate
npm run check:links
npm test
bundle exec jekyll serve
```

## Captures (replay labs)

Every lab is a hands-on guide today. Replay labs, which play back a recorded terminal session, are still supported: a capture runs in an isolated, version-tagged image named `flisk-sh/releases:<cli_version>` (`npm run capture -- <lab> --write`, then `npm run check:capture`). Do not replace transcript output with estimates.

Set `FLISK_CAPTURE_IMAGE` to use a compatible image repository. Captures fail if the image's CLI version does not match the lab pin.

## Publish

The repository is [flisk-sh/flisk-labs](https://github.com/flisk-sh/flisk-labs). GitHub Pages deploys from `.github/workflows/pages.yml` on every push to `main`.

## Git hooks

`bun install` (or `npm install`) points git at `.githooks/` through the `prepare` script. `pre-commit` checks your changes and `pre-push` runs the tests. To skip either once, add `--no-verify`. To set up by hand: `git config core.hooksPath .githooks`.
