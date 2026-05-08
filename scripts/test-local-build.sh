#!/bin/bash
# Script para testar o build localmente antes do deploy

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT/code"

echo "=== TESTE LOCAL DO CONTAINER DHT22 ==="

# Construir imagem localmente
echo "Construindo imagem Docker..."
docker build -f Dockerfile.cloudrun -t dht22-server-local:latest .

echo "✅ Imagem construída com sucesso"

# Executar container localmente
echo "Executando container localmente..."
echo "Servidor estará disponível em: http://localhost:8080"
echo "Pressione Ctrl+C para parar"

# Executar em background para permitir interrupção
docker run --rm -p 8080:8080 \
    -e PORT=8080 \
    -e FLASK_ENV=production \
    -e DATABASE_FILE=/tmp/dht22_data.db \
    -e MAX_RECORDS=1000 \
    dht22-server-local:latest &

CONTAINER_PID=$!

# Aguardar um pouco para o container inicializar
sleep 5

# Testar o serviço
echo ""
echo "Testando o serviço..."
curl -s http://localhost:8080/api/health | jq . || echo "Serviço ainda não está respondendo"

echo ""
echo "Para testar manualmente:"
echo "curl http://localhost:8080/api/health"
echo "curl http://localhost:8080/"
echo ""
echo "Para parar o container, pressione Ctrl+C"

# Aguardar interrupção
trap "echo 'Parando container...'; docker stop \$(docker ps -q --filter ancestor=dht22-server-local:latest) 2>/dev/null || true; exit 0" INT

# Manter o script rodando
wait $CONTAINER_PID
