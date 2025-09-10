#!/bin/bash

# Script para atualizar o publisher no Raspberry Pi

echo "🔄 Atualizando publisher no Raspberry Pi..."

# Configurações
RASPBERRY_IP="10.105.174.64"  # IP do Raspberry Pi (conforme visto nos logs)
RASPBERRY_USER="pi"  # Usuário padrão do Raspberry Pi
SERVER_URL="http://200.137.220.50:8080/api/ingest"

echo "📡 Conectando ao Raspberry Pi em $RASPBERRY_IP..."

# Copiar arquivo atualizado
scp backend/publish_picarx_dht22.py $RASPBERRY_USER@$RASPBERRY_IP:~/publish_picarx_dht22.py

# Configurar variáveis de ambiente e executar
ssh $RASPBERRY_USER@$RASPBERRY_IP << EOF
echo "=== CONFIGURANDO PUBLISHER ==="
export PUBLISH_URL="$SERVER_URL"
export DEVICE_ID="PiCarX-RM520N-DHT22"
export READ_INTERVAL_S="2.5"

echo "PUBLISH_URL: \$PUBLISH_URL"
echo "DEVICE_ID: \$DEVICE_ID"
echo "READ_INTERVAL: \$READ_INTERVAL_S"

echo ""
echo "=== PARANDO PROCESSO ANTERIOR ==="
pkill -f publish_picarx_dht22.py || echo "Nenhum processo anterior encontrado"

echo ""
echo "=== INICIANDO NOVO PUBLISHER ==="
nohup python3 ~/publish_picarx_dht22.py > ~/publisher.log 2>&1 &
echo "Publisher iniciado em background"

echo ""
echo "=== VERIFICANDO LOGS ==="
sleep 3
tail -10 ~/publisher.log
EOF

echo ""
echo "✅ Publisher atualizado!"
echo "📊 Para monitorar: ssh $RASPBERRY_USER@$RASPBERRY_IP 'tail -f ~/publisher.log'"
