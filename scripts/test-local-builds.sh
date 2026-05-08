#!/bin/bash

# Script para testar builds locais antes do deploy

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT/code"

echo "🧪 Testando builds locais..."
echo ""

# Testar build do backend
echo "🐳 Testando build do Backend..."
if docker build -f backend/Dockerfile -t dht22-backend:test ./backend; then
    echo "✅ Backend build OK"
else
    echo "❌ Backend build falhou"
    exit 1
fi

echo ""

# Testar build do frontend
echo "⚛️ Testando build do Frontend..."
if docker build -f frontend/Dockerfile -t dht22-frontend:test ./frontend; then
    echo "✅ Frontend build OK"
else
    echo "❌ Frontend build falhou"
    exit 1
fi

echo ""
echo "🎉 Todos os builds locais passaram!"
echo ""
echo "Para testar localmente:"
echo "Backend:  docker run -p 8080:8080 dht22-backend:test"
echo "Frontend: docker run -p 80:80 dht22-frontend:test"
