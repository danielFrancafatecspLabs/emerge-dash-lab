# Current State

- `tsc --noEmit` is passing.
- The dev server runs with `.
  node_modules\.bin\next.cmd dev -p 3003`.
- The MBR page is the active focus at `/jira/report/mbr`.
- `EpicsListModal` was fixed to avoid nested button hydration errors.
- `src/lib/bloqueios-data.ts` is the shared source for bloqueios data.
- Domain rules for Iniciativa vs Experimento live in `CLAUDE.md`.
- `normalizeLab()` added in `src/lib/mappers.ts` to normalize lab name variations (BeOn Labs, BeON Labs, etc. → "Beon Labs").
- `src/lib/weekly.ts` — `buildWeeklyData()` accepts `board2735Config?: JiraBoardConfiguration` and uses `buildColunaPorStatusId()` to dynamically discover which status IDs belong to BACKLOG/REFINAMENTO columns in board 2735.
- `src/lib/governanca.ts` — COLUMN_DEFS uses "Aguardando Piloto" instead of "Concluídos", populated directly from Iniciativas via `iniciativaToDot()`.
- `src/components/dashboard/ExperimentoModal.tsx` and `EpicModal.tsx` — cleaned up (7 fields removed).
- Status ID `10004` means "Cancelado" in board 2735 (Experimentação), not "BACKLOG". Board 2735 uses `10057` for Backlog.
