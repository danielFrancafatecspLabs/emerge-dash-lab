# Copilot Retriever Rules

This file is the default retrieval policy for this workspace.
Use only the smallest relevant context for every Copilot call.

## Always include
- `CLAUDE.md`
- `package.json`
- The current file the user is editing
- Any directly imported files from the current file
- Any route, component, or lib file that owns the behavior being changed
- The latest validation result when available

## Prefer these anchors
- `src/app/report/page.tsx`
- `src/app/report/mbr/page.tsx`
- `src/components/report/*`
- `src/components/dashboard/*`
- `src/lib/mappers.ts`
- `src/lib/types.ts`
- `src/lib/report-utils.ts`
- `src/lib/bloqueios-data.ts`
- `src/app/api/*/route.ts`

## Do not expand context unless needed
- Avoid loading unrelated app routes
- Avoid loading all dashboard components
- Avoid loading generated build output
- Avoid loading browser logs unless the task is about runtime behavior

## State to preserve
- Current validation status
- The last failing command or error
- The exact files already edited in this session
- Any domain rules from `CLAUDE.md`

## Working rule
- Start from the current file and its direct dependencies.
- Only widen to one hop at a time when the current file does not own the behavior.
- Prefer the owning route, component, or lib over broad search.

## Retrieval contract
- Always read this file first.
- Always read `CLAUDE.md` next for domain rules.
- Always read `copilot-state.md` for current validated state.
- Then load only the current file and its direct imports.
- Do not load unrelated files unless the current task cannot be resolved locally.