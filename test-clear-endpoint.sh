#!/bin/bash

# Script para testar o endpoint de limpeza

echo "🧪 Testando endpoint de limpeza..."

SERVER_URL="http://200.137.220.50:8080"

echo "📊 Verificando registros antes da limpeza:"
curl -s "$SERVER_URL/api/health" | jq '.database_records'

echo ""
echo "🗑️ Executando limpeza do banco:"
RESPONSE=$(curl -X POST "$SERVER_URL/api/clear" \
  -H "Content-Type: application/json" \
  -d '{}' 2>/dev/null)

echo "Resposta: $RESPONSE"

if echo "$RESPONSE" | grep -q "success"; then
    echo "✅ Limpeza executada com sucesso!"
    
    echo ""
    echo "📊 Verificando registros após a limpeza:"
    curl -s "$SERVER_URL/api/health" | jq '.database_records'
    
    echo ""
    echo "📡 Verificando dados do ESP32:"
    curl -s "$SERVER_URL/api/latest/ESP32-DHT22-Publisher" | jq '.data.temperature, .data.humidity' 2>/dev/null || echo "Nenhum dado encontrado"
    
    echo ""
    echo "📡 Verificando dados do PiCarX:"
    curl -s "$SERVER_URL/api/latest/PiCarX-RM520N-DHT22" | jq '.data.temperature, .data.humidity' 2>/dev/null || echo "Nenhum dado encontrado"
else
    echo "❌ Erro na limpeza: $RESPONSE"
fi
