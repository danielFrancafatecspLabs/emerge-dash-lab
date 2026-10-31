import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// Build embutido no Jira Viewer: saída em bundle/ (servida em /jira/osint-app/ pela rota src/app/osint-app). Em produção,
// ops/osint-app-deploy.sh publica builds novos do signals-osint em OSINT_APP_DIR, que tem prioridade sobre este.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, '.') } },
  build: { outDir: 'bundle', emptyOutDir: true },
});
