#!/bin/bash

# Script simples para testar e corrigir o PiCarX

echo "🔧 CORREÇÃO RÁPIDA DO PiCarX"
echo "============================"

PI_IP="10.105.174.64"
PI_USER="pi"

echo "📡 Testando conectividade com PiCarX ($PI_IP)..."

if ping -c 2 $PI_IP > /dev/null 2>&1; then
    echo "✅ PiCarX acessível via WiFi"
else
    echo "❌ PiCarX não acessível"
    exit 1
fi

echo ""
echo "📤 Enviando script corrigido..."

# Copiar script corrigido
scp publish_picarx_dht22_fixed.py $PI_USER@$PI_IP:/home/pi/scripts/publish_picarx_dht22.py

# Dar permissão de execução
ssh $PI_USER@$PI_IP "chmod +x /home/pi/scripts/publish_picarx_dht22.py"

echo "✅ Script enviado e configurado"

echo ""
echo "🧪 Testando script manualmente..."

# Testar o script por alguns segundos
ssh $PI_USER@$PI_IP "cd /home/pi/scripts && timeout 30 python3 publish_picarx_dht22.py" || echo "Teste concluído"

echo ""
echo "📊 Verificando dados no servidor..."
sleep 5

curl -s "http://200.137.220.50:8080/api/latest/PiCarX-RM520N-DHT22" | jq . || echo "Nenhum dado encontrado ainda"

echo ""
echo "✅ CORREÇÃO CONCLUÍDA!"
echo "======================"
echo "Para executar o script continuamente:"
echo "ssh $PI_USER@$PI_IP 'cd /home/pi/scripts && python3 publish_picarx_dht22.py'"
