# Contributing to Flisk Labs

Thank you for contributing to Flisk Labs! This guide outlines how to propose new labs, update existing content, and validate your changes before submitting a pull request.

## Adding a New Lab

Each lab is defined as a YAML file and cross-referenced in the catalog data.

### 1. Create the Lab Specification

Create a new file in `content/labs/<id>.yaml` following the lab schema:

```yaml
id: 55-my-new-lab
title: My New Lab Title
track: foundations
level: beginner
duration_min: 10
mode: guide
goal: "A clear one-sentence summary of what this lab accomplishes."
build: Description of what artifact or system the user produces.
needs:
  - Node.js 20 or newer
docs:
  - label: Flisk Documentation
    url: https://flisk.sh/docs/
steps:
  - id: step-one
    task: First actionable step
    explain: Brief context on why this step is needed.
    cmd: flisk --help
    expect: Help text prints with available commands.
    files: []
```

### 2. Update the Catalog

Add or associate your lab ID in `_data/catalog.yml` under relevant entries:

```yaml
- title: Resource Title
  section: Core framework and releases
  classification: Official
  url: https://flisk.sh/docs/
  description: Description of the resource.
  lab_ids:
    - 55-my-new-lab
```

## Validation & Quality Checks

Run the content validators locally to ensure schemas and links match expectations:

```bash
# Validate lab and track schema structure
npm run validate

# Validate reachable external URLs and catalog references
npm run check:links
```

All validation scripts must pass with exit code `0`.

## Developer Certificate of Origin (DCO)

All commits to `flisk-sh/flisk-labs` require a Developer Certificate of Origin sign-off line. Sign your commit using the `-s` flag:

```bash
git commit -s -m "feat(labs): add lab 55 my new lab"
```

This appends a `Signed-off-by: Your Name <your.email@example.com>` line to your commit message.
