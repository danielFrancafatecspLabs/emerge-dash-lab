# Current State

- `tsc --noEmit` is passing.
- The dev server runs with `node node_modules\next\dist\bin\next dev -p 3002`.
- The Weekly page is the active focus at `/jira/weekly`.
- `src/lib/weekly.ts` — `buildWeeklyData()` accepts `board2735Config?: JiraBoardConfiguration` and uses `buildColunaPorStatusId()` to dynamically discover which status IDs belong to BACKLOG/REFINAMENTO columns in board 2735.
- `src/lib/governanca.ts` — COLUMN_DEFS uses "Aguardando Piloto" instead of "Concluídos", populated directly from Iniciativas via `iniciativaToDot()`.
- `src/components/dashboard/ExperimentoModal.tsx` and `EpicModal.tsx` — cleaned up (7 fields removed).
- Domain rules for Iniciativa vs Experimento live in `CLAUDE.md`.
- Status ID `10004` means "Cancelado" in board 2735 (Experimentação), not "BACKLOG". Board 2735 uses `10057` for Backlog.