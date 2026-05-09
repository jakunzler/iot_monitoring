#!/bin/bash
# Script para corrigir o servidor

echo "=== CORRIGINDO SERVIDOR DHT22 ==="

# Parar o serviço
echo "Parando serviço..."
sudo systemctl stop dht22-server

echo "Copiando server_production.py a partir do repositório..."
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC_BACKEND="${DHT22_BACKEND_ROOT:-$REPO_ROOT/code/backend}"
sudo cp "$SRC_BACKEND/server_production.py" /opt/dht22-server/server.py

# Ajustar permissões
echo "Ajustando permissões..."
sudo chown cerise:cerise /opt/dht22-server/server.py

# Reiniciar serviço
echo "Reiniciando serviço..."
sudo systemctl start dht22-server

# Verificar status
echo "Verificando status..."
sleep 3
sudo systemctl status dht22-server --no-pager

# Testar API
echo "Testando API..."
sleep 2
curl -s http://localhost:8080/api/health

echo ""
echo "=== CORREÇÃO CONCLUÍDA ==="
