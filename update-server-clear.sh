#!/bin/bash

# Script para atualizar o servidor com o novo endpoint de limpeza

echo "🔄 Atualizando servidor com endpoint de limpeza..."

# Configurações
SERVER_IP="200.137.220.50"
SERVER_USER="cerise"
SERVER_PATH="/opt/dht22-server"

echo "📡 Conectando ao servidor $SERVER_IP..."

# Copiar arquivo atualizado
scp backend/server.py $SERVER_USER@$SERVER_IP:$SERVER_PATH/server.py

# Reiniciar serviço
ssh $SERVER_USER@$SERVER_IP << EOF
echo "=== PARANDO SERVIÇO ==="
sudo systemctl stop dht22-server

echo "=== REINICIANDO SERVIÇO ==="
sudo systemctl start dht22-server
sleep 3

echo "=== VERIFICANDO STATUS ==="
sudo systemctl status dht22-server --no-pager -l

echo "=== TESTANDO NOVO ENDPOINT ==="
curl -s http://localhost:8080/api/health | python3 -m json.tool || echo "Health check falhou"
EOF

echo ""
echo "✅ Servidor atualizado!"
echo "🧪 Testando endpoint de limpeza:"
curl -X POST "http://$SERVER_IP:8080/api/clear" \
  -H "Content-Type: application/json" \
  -d '{}' | jq . || echo "Teste falhou"
