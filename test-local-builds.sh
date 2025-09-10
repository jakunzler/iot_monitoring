#!/bin/bash

# Script para testar builds locais antes do deploy

set -e

echo "🧪 Testando builds locais..."
echo ""

# Testar build do backend
echo "🐳 Testando build do Backend..."
if docker build -f Dockerfile.backend -t dht22-backend:test .; then
    echo "✅ Backend build OK"
else
    echo "❌ Backend build falhou"
    exit 1
fi

echo ""

# Testar build do frontend
echo "⚛️ Testando build do Frontend..."
if docker build -f Dockerfile.frontend -t dht22-frontend:test .; then
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
