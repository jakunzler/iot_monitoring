#!/bin/bash
# Script para atualizar o módulo 5G com a URL do Cloud Run

set -e

# Configurações
PICARX_HOST="picarx.local"
PICARX_USER="pi"
SCRIPT_PATH="/home/pi/scripts/publish_dht22.py"

echo "=== ATUALIZANDO MÓDULO 5G PARA CLOUD RUN ==="

# Verificar se a URL foi fornecida
if [ -z "$1" ]; then
    echo "❌ Uso: $0 <URL_DO_CLOUD_RUN>"
    echo "Exemplo: $0 https://dht22-server-xxxxx-uc.a.run.app"
    exit 1
fi

CLOUD_RUN_URL="$1"
PUBLISH_URL="${CLOUD_RUN_URL}/api/ingest"

echo "URL do Cloud Run: ${CLOUD_RUN_URL}"
echo "URL de publicação: ${PUBLISH_URL}"
echo ""

# Verificar conectividade com o PiCarX
echo "Verificando conectividade com PiCarX..."
if ! ping -c 1 ${PICARX_HOST} &> /dev/null; then
    echo "❌ Não foi possível conectar ao PiCarX (${PICARX_HOST})"
    echo "Verifique se o PiCarX está ligado e acessível"
    exit 1
fi

echo "✅ PiCarX acessível"

# Conectar no PiCarX e atualizar o arquivo
echo "Conectando no PiCarX e atualizando configuração..."

ssh ${PICARX_USER}@${PICARX_HOST} << EOF
    echo "Atualizando PUBLISH_URL para: ${PUBLISH_URL}"
    
    # Fazer backup do arquivo atual
    cp ${SCRIPT_PATH} ${SCRIPT_PATH}.backup
    
    # Atualizar a URL no arquivo
    sed -i "s|PUBLISH_URL.*=.*|PUBLISH_URL   = os.getenv(\"PUBLISH_URL\", \"${PUBLISH_URL}\")|" ${SCRIPT_PATH}
    
    echo "✅ Arquivo atualizado com sucesso"
    echo "Nova configuração:"
    grep "PUBLISH_URL" ${SCRIPT_PATH}
    
    # Testar a nova configuração
    echo "Testando nova configuração..."
    python3 -c "
import os
PUBLISH_URL = os.getenv('PUBLISH_URL', '${PUBLISH_URL}')
print(f'URL configurada: {PUBLISH_URL}')
"
EOF

echo ""
echo "=== ATUALIZAÇÃO CONCLUÍDA ==="
echo "O módulo 5G agora enviará dados para: ${PUBLISH_URL}"
echo ""
echo "Para testar, execute no PiCarX:"
echo "cd scripts && python3 publish_dht22.py"
echo ""
echo "Para verificar os dados no Cloud Run:"
echo "curl ${CLOUD_RUN_URL}/api/health"
echo "curl ${CLOUD_RUN_URL}/api/latest/PiCarX-RM520N-DHT22"
echo "================================================"
