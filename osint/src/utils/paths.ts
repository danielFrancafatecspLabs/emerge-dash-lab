// Bases configuráveis em build: standalone usa '/data' e '/api'; embutido no Jira Viewer
// aponta para as rotas Next (/jira/api/osint/*), alimentadas pelo vault de sinais.
export const DATA_BASE: string = import.meta.env.VITE_DATA_BASE ?? '/data';
export const API_BASE: string = import.meta.env.VITE_API_BASE ?? '/api';
