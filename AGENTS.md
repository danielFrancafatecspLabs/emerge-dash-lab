# Workspace Agent Rules

- Read `copilot-instructions.md` before any code change.
- Read `CLAUDE.md` for domain rules before any code change.
- Read `copilot-state.md` for current validated state before any code change.
- Start from the current file and its direct imports.
- Expand context only one hop at a time when needed.
- Prefer the owning route, component, or lib over broad search.
- Avoid loading unrelated routes, generated output, or browser logs unless the task requires them.