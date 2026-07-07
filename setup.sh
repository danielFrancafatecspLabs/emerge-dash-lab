#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo ""
echo "=================================================="
echo "  Dashboard Executivo de Experimentos — Telecom"
echo "=================================================="
echo ""

# Verifica Node.js
if ! command -v node &>/dev/null; then
  echo "ERRO: Node.js não encontrado. Instale via https://nodejs.org (>=18)"
  exit 1
fi

NODE_VER=$(node -e "process.stdout.write(process.versions.node.split('.')[0])")
if [ "$NODE_VER" -lt 18 ]; then
  echo "ERRO: Node.js 18+ é necessário (atual: $(node -v))"
  exit 1
fi

echo "✓ Node.js $(node -v)"

# Verifica .env.local
if [ ! -f ".env.local" ]; then
  echo "AVISO: .env.local não encontrado. Copiando de .env..."
  cp .env .env.local
fi
echo "✓ .env.local encontrado"

# Instala dependências
if [ ! -d "node_modules" ]; then
  echo ""
  echo "Instalando dependências..."
  npm install
else
  echo "✓ node_modules já existe (pulando npm install)"
fi

echo ""
echo "Iniciando servidor na porta 3003..."
echo "Acesse: http://localhost:3003"
echo ""

npm run dev
