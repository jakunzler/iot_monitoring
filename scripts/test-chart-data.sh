#!/bin/bash

# Script para testar o gráfico com dados simulados

echo "🧪 Testando gráfico com dados simulados..."

SERVER_URL="http://200.137.220.50:8080/api/ingest"
DEVICE_ID="ESP32-DHT22-Publisher"

# Simular dados com timestamps Unix reais
for i in {1..10}; do
    TEMP=$(echo "33.0 + $RANDOM/100000" | bc -l | cut -c1-4)
    HUM=$(echo "30.0 + $RANDOM/100000" | bc -l | cut -c1-4)
    TIMESTAMP=$(date +%s)
    
    echo "📊 Enviando: Temp=${TEMP}°C, Hum=${HUM}%, Timestamp=${TIMESTAMP}"
    
    curl -X POST "$SERVER_URL" \
        -H "Content-Type: application/json" \
        -d "{
            \"device_id\": \"$DEVICE_ID\",
            \"sensor\": \"dht22\",
            \"data\": {
                \"temperature\": $TEMP,
                \"humidity\": $HUM,
                \"temperature_f\": $(echo "$TEMP * 9/5 + 32" | bc -l | cut -c1-5)
            },
            \"metadata\": {
                \"wifi_rssi\": -55,
                \"wifi_ip\": \"10.105.174.224\",
                \"uptime_seconds\": $TIMESTAMP
            },
            \"timestamp\": $TIMESTAMP,
            \"reading_number\": $((700 + i))
        }" | jq '.status, .message' 2>/dev/null || echo "Erro na requisição"
    
    echo ""
    sleep 1
done

echo "✅ Teste concluído!"
echo "📊 Verificando dados salvos:"
curl -s "http://200.137.220.50:8080/api/history/$DEVICE_ID?limit=5" | jq '.[] | {timestamp, temperature: .data.temperature, humidity: .data.humidity}'
