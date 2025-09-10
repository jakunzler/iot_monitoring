#!/bin/bash

# Script para monitorar dados que chegam ao servidor

echo "📊 Monitorando dados do servidor 200.137.220.50..."
echo "Pressione Ctrl+C para parar"
echo ""

while true; do
    echo "=== $(date) ==="
    
    # Health check
    echo "🏥 Health Check:"
    curl -s "http://200.137.220.50:8080/api/health" | jq '.database_records, .status' 2>/dev/null || echo "Servidor não responde"
    
    # Último dado do PiCarX
    echo "📡 Último dado PiCarX:"
    curl -s "http://200.137.220.50:8080/api/latest/PiCarX-RM520N-DHT22" | jq '.data.temperature, .data.humidity, .timestamp' 2>/dev/null || echo "Nenhum dado encontrado"
    
    # Último dado do ESP32
    echo "📡 Último dado ESP32:"
    curl -s "http://200.137.220.50:8080/api/latest/ESP32-DHT22-Publisher" | jq '.data.temperature, .data.humidity, .timestamp' 2>/dev/null || echo "Nenhum dado encontrado"
    
    echo ""
    sleep 10
done
