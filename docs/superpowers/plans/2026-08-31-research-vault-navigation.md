# Research Vault Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Serve the `research-obsidian` vault from an automatically updated local snapshot and provide safe file-tree and graph navigation in the Jira Viewer.

**Architecture:** A tested server-only parser indexes Markdown below `Researchs/` into documents and graph edges. The UI consumes that index through the existing authenticated API and renders either a collapsible tree or an SVG graph, while a systemd timer atomically updates an immutable vault snapshot on the VM.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript, Vitest, `react-markdown`, `remark-gfm`, Bash 5, Git, systemd.

**Spec:** `docs/superpowers/specs/2026-08-31-research-vault-navigation-design.md`

## Global Constraints

- A completed research is a Markdown file directly inside `Researchs/<category>/<topic>/`.
- Use frontmatter `created` as completion/inclusion date and `updated` as revision date.
- Keep the vault read-only from Jira Viewer.
- Never render raw HTML from Markdown.
- Never resolve API paths outside `Researchs/` or outside the indexed document set.
- The VM source path is `/home/azureuser/research-obsidian-current`.
- The updater follows only `origin/main`, activates atomically, and retains three releases.
- Use commit message `updates` for repository commits.

---

### Task 1: Vault parser and graph model

**Files:**
- Create: `src/lib/research-vault.ts`
- Create: `src/lib/research-vault.test.ts`

**Interfaces:**
- Consumes: a vault root containing `Researchs/` and optional `.research-revision`.
- Produces: `loadResearchVault(root): Promise<ResearchVault>`, `loadResearchDocument(root, index, relativePath): Promise<ResearchDocumentContent>`, `clearResearchVaultCache(): void`.
- Types: `ResearchDocument`, `ResearchDocumentContent`, `ResearchEdge`, `ResearchVault`.

- [ ] **Step 1: Write failing fixture-based parser tests**

Create tests that build a temporary vault with category, topic, concept and paper files. Include a topic folder `Adaptive Agents` whose principal file is `Adaptive Agents (ALMAA).md`, wikilinks with and without aliases, and valid `created`/`updated` fields. Assert classification, the topic count, parsed dates, hierarchy edges, resolved wikilink edges and deterministic ordering.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- src/lib/research-vault.test.ts`

Expected: FAIL because `./research-vault` does not exist.

- [ ] **Step 3: Implement the minimal server-only parser**

Define the public model:

```ts
export type ResearchDocumentType = 'category' | 'topic' | 'concept' | 'paper'

export interface ResearchDocument {
  id: string
  path: string
  name: string
  title: string
  type: ResearchDocumentType
  category: string
  topic: string | null
  tags: string[]
  created: string | null
  updated: string | null
  links: string[]
}

export interface ResearchEdge {
  source: string
  target: string
  kind: 'hierarchy' | 'wikilink'
}

export interface ResearchVault {
  revision: string
  generatedAt: string
  completedResearchCount: number
  documents: ResearchDocument[]
  edges: ResearchEdge[]
}
```

Use `node:fs/promises`, normalize all relative paths with `/`, parse only the first YAML-like frontmatter block, and match ISO dates with `/^20\d{2}-\d{2}-\d{2}$/`. Discover topic principals structurally rather than constructing a filename from the directory.

- [ ] **Step 4: Add traversal and cache invalidation tests**

Assert that `../.env`, absolute paths and non-indexed files are rejected. Change `.research-revision`, call `loadResearchVault` again and assert the new document set is returned without restarting the process.

- [ ] **Step 5: Run parser tests and verify GREEN**

Run: `npm test -- src/lib/research-vault.test.ts`

Expected: all parser tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/research-vault.ts src/lib/research-vault.test.ts
git commit -m "updates"
```

### Task 2: Safe research API

**Files:**
- Modify: `src/app/api/pesquisas/route.ts`
- Create: `src/app/api/pesquisas/route.test.ts`

**Interfaces:**
- Consumes: `RESEARCH_VAULT_PATH` and Task 1 parser functions.
- Produces: `GET /jira/api/pesquisas` and `GET /jira/api/pesquisas?file=<indexed path>`.

- [ ] **Step 1: Write failing route tests**

Mock `loadResearchVault` and `loadResearchDocument`. Assert index JSON, document JSON, 400 when `file` is empty, 404 for an unknown document, and 503 when the root is unavailable. Assert public errors do not contain an absolute path.

- [ ] **Step 2: Run focused route tests and verify RED**

Run: `npm test -- src/app/api/pesquisas/route.test.ts`

Expected: FAIL against the current GitHub-backed route contract.

- [ ] **Step 3: Replace GitHub traversal with the local parser**

Set `export const runtime = 'nodejs'`. Resolve the root only from `process.env.RESEARCH_VAULT_PATH`; return 503 when missing. Return the `ResearchVault` index when no `file` is present and `{ document, content }` for a known file. Map parser not-found errors to 404 and log internal details only on the server.

- [ ] **Step 4: Run route tests and verify GREEN**

Run: `npm test -- src/app/api/pesquisas/route.test.ts`

Expected: all API tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/pesquisas/route.ts src/app/api/pesquisas/route.test.ts
git commit -m "updates"
```

### Task 3: Shared client model, tree filtering and safe document reader

**Files:**
- Create: `src/components/research/types.ts`
- Create: `src/components/research/research-view-model.ts`
- Create: `src/components/research/research-view-model.test.ts`
- Create: `src/components/research/ResearchTree.tsx`
- Create: `src/components/research/ResearchDocumentPanel.tsx`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: Task 1 JSON-compatible types.
- Produces: `buildResearchTree(documents)`, `filterResearchTree(nodes, query)`, `ResearchTree`, `ResearchDocumentPanel`.

- [ ] **Step 1: Write failing pure view-model tests**

Assert `category → topic → Concepts/Papers → document`, alphabetical sibling ordering, ancestor retention during search, tag matching and `created` metadata on topic rows.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- src/components/research/research-view-model.test.ts`

Expected: FAIL because the view-model module does not exist.

- [ ] **Step 3: Install safe Markdown dependencies**

Run: `npm install react-markdown remark-gfm`

Expected: `package.json` and `package-lock.json` contain both direct dependencies.

- [ ] **Step 4: Implement the pure tree view-model**

Create stable node IDs from document paths. Build virtual `Concepts` and `Papers` groups only when they contain children. Normalize search with `toLocaleLowerCase('pt-BR')` and retain all ancestors of a match.

- [ ] **Step 5: Implement the tree and reader**

Use buttons for expandable rows and document selection. Show type icons, child counts and date chips without interpreting dates in the browser timezone. Render Markdown with `react-markdown` and `remark-gfm`; omit `rehype-raw`. Render HTTP links with `target="_blank" rel="noopener noreferrer"` and resolve wikilinks through a preprocessing/token component that calls `onSelect` for known targets.

- [ ] **Step 6: Run tests and verify GREEN**

Run: `npm test -- src/components/research/research-view-model.test.ts`

Expected: all view-model tests pass.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/components/research
git commit -m "updates"
```

### Task 4: Obsidian-style SVG graph and page composition

**Files:**
- Create: `src/components/research/research-graph-layout.ts`
- Create: `src/components/research/research-graph-layout.test.ts`
- Create: `src/components/research/ResearchGraph.tsx`
- Create: `src/components/research/ResearchExplorer.tsx`
- Modify: `src/app/pesquisas/page.tsx`

**Interfaces:**
- Consumes: `ResearchVault`, `ResearchTree`, `ResearchDocumentPanel`.
- Produces: `layoutResearchGraph(documents, edges, width, height)`, `ResearchGraph`, and the complete explorer page.

- [ ] **Step 1: Write failing deterministic layout tests**

Assert identical input produces identical coordinates, every node remains inside the requested bounds, category clusters occupy distinct centers and connected documents produce drawable edges.

- [ ] **Step 2: Run focused graph tests and verify RED**

Run: `npm test -- src/components/research/research-graph-layout.test.ts`

Expected: FAIL because the layout module does not exist.

- [ ] **Step 3: Implement deterministic clustered layout**

Place category centers on a large ring, topics on a ring around their category and supporting documents on smaller rings around their topic. Derive stable angular offsets from a string hash of each path. Clamp all coordinates to the SVG bounds.

- [ ] **Step 4: Implement graph interactions**

Render hierarchy and wikilink edges in separate SVG groups. Add wheel zoom, pointer-drag pan, a reset-view button, node tooltips, search dimming and click selection. Use semantic buttons outside SVG for mode switching and keyboard-accessible search results.

- [ ] **Step 5: Compose the page**

Replace the existing monolithic client page with `ResearchExplorer`. Fetch the index once, preserve mode/search/selection state, lazy-load document bodies, show completed-research count and revision, and implement loading, empty, unavailable and removed-document states.

- [ ] **Step 6: Run focused and full application verification**

Run: `npm test -- src/components/research/research-graph-layout.test.ts src/components/research/research-view-model.test.ts`

Expected: all focused tests pass.

Run: `npm test`

Expected: all repository tests pass.

Run: `npm run build`

Expected: Next.js production build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/app/pesquisas/page.tsx src/components/research
git commit -m "updates"
```

### Task 5: Atomic research snapshot updater

**Files:**
- Create: `ops/research-vault-deploy.sh`
- Create: `ops/tests/research-vault-deploy-test.sh`

**Interfaces:**
- Consumes: Git remote/branch, credential file, release root and current symlink.
- Produces: an activated SHA release containing `Researchs/`, `Researches Index.md` and `.research-revision`.
- Environment: `RESEARCH_DEPLOY_ROOT`, `RESEARCH_CURRENT_LINK`, `RESEARCH_CREDENTIAL_FILE`, `RESEARCH_REPO_URL`, `RESEARCH_BRANCH`, `RESEARCH_KEEP_RELEASES`.

- [ ] **Step 1: Write the failing shell integration test**

Create a temporary bare remote and push a minimal valid vault. Assert first activation, no-op for the same SHA, activation of a second valid SHA, rejection of a topic with invalid `created`, preservation of the prior symlink and retention of exactly three SHA releases.

- [ ] **Step 2: Run the updater test and verify RED**

Run: `bash ops/tests/research-vault-deploy-test.sh`

Expected: FAIL because the executable updater is absent.

- [ ] **Step 3: Implement the updater**

Use `set -Eeuo pipefail`, `umask 077`, `flock`, a bare repository and `git archive`. Validate `Researchs/`, `Researches Index.md`, at least one direct topic Markdown, and ISO `created`/`updated` values for every direct topic Markdown. Write the exact 40-character SHA to `.research-revision`, atomically replace the current symlink and retain the newest three releases.

- [ ] **Step 4: Run shell tests and verify GREEN**

Run: `bash ops/tests/research-vault-deploy-test.sh`

Expected: `PASS: research vault deployment engine`.

- [ ] **Step 5: Commit**

```bash
git add ops/research-vault-deploy.sh ops/tests/research-vault-deploy-test.sh
git commit -m "updates"
```

### Task 6: Systemd automation and operator documentation

**Files:**
- Create: `ops/systemd/research-vault-deploy.service`
- Create: `ops/systemd/research-vault-deploy.timer`
- Create: `ops/tests/research-vault-systemd-test.sh`
- Create: `ops/README-research-vault.md`

**Interfaces:**
- Consumes: `/usr/local/bin/research-vault-deploy` and a mode-0600 credential file.
- Produces: a five-minute updater timer and documented install/rollback/diagnostic procedure.

- [ ] **Step 1: Write failing unit validation tests**

Assert the service is `Type=oneshot`, runs as `azureuser`, invokes the reviewed updater, and the timer uses `OnCalendar=*:0/5`, `Persistent=true` and `RandomizedDelaySec=20`. Run `systemd-analyze verify` when available.

- [ ] **Step 2: Run static tests and verify RED**

Run: `bash ops/tests/research-vault-systemd-test.sh`

Expected: FAIL because the units do not exist.

- [ ] **Step 3: Create units and operator guide**

Document manual update, active revision, timer logs, credential rotation, rollback by symlink and the fact that only committed/pushed research reaches the VM.

- [ ] **Step 4: Run unit tests and verify GREEN**

Run: `bash ops/tests/research-vault-systemd-test.sh`

Expected: all static checks and `systemd-analyze verify` pass.

- [ ] **Step 5: Commit**

```bash
git add ops/systemd ops/tests/research-vault-systemd-test.sh ops/README-research-vault.md
git commit -m "updates"
```

### Task 7: Local integration, remote installation and end-to-end verification

**Files:**
- Modify (ignored): `.env`
- Modify (ignored): `.env.local`
- Modify remotely: `/home/azureuser/jira-viewer-deploy/shared/.env.local`
- Install remotely: `/usr/local/bin/research-vault-deploy`
- Install remotely: `/etc/systemd/system/research-vault-deploy.service`
- Install remotely: `/etc/systemd/system/research-vault-deploy.timer`

**Interfaces:**
- Consumes: all preceding tasks and SSH key `/home/matheus-moura/Downloads/vm-beonlabs_key.pem`.
- Produces: local and VM-backed end-to-end research navigation.

- [ ] **Step 1: Configure and verify local source**

Set `RESEARCH_VAULT_PATH=/mnt/sda1/Projects/claro/research` in both ignored environment files. Start the app and assert `/jira/api/pesquisas` reports 18 completed research files, including the ALMAA principal path.

- [ ] **Step 2: Sanitize the local research remote**

Change the remote URL to `https://github.com/Colab-Claro/research-obsidian.git`. Store credentials only in a mode-0600 credential helper file; never print the token. Report that the exposed token must be rotated.

- [ ] **Step 3: Publish related vault content without touching Obsidian workspace state**

Stage only `README.md`, `Researches Index.md` and `Researchs/Advanced Research/`. Leave `.obsidian/graph.json` and `.obsidian/workspace.json` unstaged. Commit with `updates`, verify the exact diff, and push `main` only after the push target and commit set are confirmed.

- [ ] **Step 4: Install updater artifacts on the VM**

Upload to a remote `mktemp` staging directory, compare SHA-256 hashes, install the executable and units with exact modes, configure the credential file without command-line exposure, run `systemd-analyze verify`, enable/start the timer and trigger one manual update.

- [ ] **Step 5: Configure the Jira Viewer service**

Atomically add `RESEARCH_VAULT_PATH=/home/azureuser/research-obsidian-current` to the shared `.env.local`, preserve a mode-0600 backup, restart `jira-viewer.service`, and roll back the environment file if service or health validation fails.

- [ ] **Step 6: Publish the Jira Viewer implementation**

Run `npm test` and `npm run build` fresh, inspect `git status` and commit only intended files with `updates`. Push `main` using a non-embedded credential and wait for `jira-viewer-deploy.service` to activate the exact new SHA.

- [ ] **Step 7: Verify production end to end**

Assert both services/timers are active, the research `.research-revision` equals remote `origin/main`, `/jira/api/pesquisas` returns the expected completed count, the ALMAA path resolves, `/jira/login` returns HTTP 200 and no credential appears in either Git remote URL or journal output.

- [ ] **Step 8: Record final state**

Report local branches and SHAs, remote active SHAs, tests/build results, intentionally preserved dirty Obsidian files, backup paths and the token-rotation requirement.
