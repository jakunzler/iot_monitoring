#!/bin/bash

# Script para testar ingestão com dados simulados do PiCarX

echo "🧪 Testando ingestão de dados do PiCarX..."

SERVER_URL="http://200.137.220.50:8080/api/ingest"

# Simular dados do PiCarX (temperatura e umidade similares aos dados reais)
for i in {1..5}; do
    TEMP=$(echo "33.0 + $RANDOM/100000" | bc -l | cut -c1-4)
    HUM=$(echo "30.0 + $RANDOM/100000" | bc -l | cut -c1-4)
    TIMESTAMP=$(date +%s)
    
    echo "📊 Enviando: Temp=${TEMP}°C, Hum=${HUM}%"
    
    curl -X POST "$SERVER_URL" \
        -H "Content-Type: application/json" \
        -d "{
            \"device_id\": \"PiCarX-RM520N-DHT22\",
            \"sensor\": \"dht22\",
            \"data\": {
                \"temperature\": $TEMP,
                \"humidity\": $HUM,
                \"temperature_f\": $(echo "$TEMP * 9/5 + 32" | bc -l | cut -c1-5)
            },
            \"metadata\": {
                \"gpio_pin\": 11,
                \"module_type\": \"5G\",
                \"connection_type\": \"RM520N\",
                \"uptime_seconds\": $((1000 + i * 10)),
                \"wifi_ip\": \"192.168.225.58\"
            },
            \"timestamp\": $TIMESTAMP,
            \"reading_number\": $i
        }" | jq '.status, .message' 2>/dev/null || echo "Erro na requisição"
    
    echo ""
    sleep 2
done

echo "✅ Teste concluído!"
echo "📊 Verificando dados salvos:"
curl -s "http://200.137.220.50:8080/api/latest/PiCarX-RM520N-DHT22" | jq '.data.temperature, .data.humidity, .timestamp'
