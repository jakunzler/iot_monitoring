#!/bin/bash

# Script para testar envio de dados do PiCarX

echo "🧪 Testando envio de dados do PiCarX..."

SERVER_URL="http://200.137.220.50:8080"

# Dados de teste do PiCarX
TEST_DATA='{
  "device_id": "PiCarX-RM520N-DHT22",
  "timestamp": '$(date +%s)',
  "sensor_type": "dht22",
  "temperature": 25.5,
  "humidity": 60.2,
  "temperature_f": 77.9,
  "wifi_rssi": -45,
  "wifi_ip": "192.168.1.100",
  "uptime_seconds": 3600,
  "reading_number": 1,
  "module_type": "PiCarX",
  "connection_type": "5G",
  "gpio_pin": 11
}'

echo "📤 Enviando dados de teste..."
RESPONSE=$(curl -X POST "$SERVER_URL/api/ingest" \
  -H "Content-Type: application/json" \
  -d "$TEST_DATA" \
  -w "\nHTTP_CODE:%{http_code}" 2>/dev/null)

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
RESPONSE_BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')

echo "Resposta HTTP: $HTTP_CODE"
echo "Corpo da resposta: $RESPONSE_BODY"

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Dados enviados com sucesso!"
    
    echo ""
    echo "📊 Verificando dados no servidor..."
    curl -s "$SERVER_URL/api/latest/PiCarX-RM520N-DHT22" | jq .
    
    echo ""
    echo "📈 Verificando histórico..."
    curl -s "$SERVER_URL/api/history/PiCarX-RM520N-DHT22" | jq .
    
else
    echo "❌ Erro ao enviar dados: $RESPONSE_BODY"
fi
