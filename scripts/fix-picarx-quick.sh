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

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PUBLISHER_PY="$REPO_ROOT/code/publisher/publish_picarx_dht22.py"

ssh $PI_USER@$PI_IP "mkdir -p /home/pi/publisher/systemd"

scp "$PUBLISHER_PY" $PI_USER@$PI_IP:/home/pi/publisher/publish_picarx_dht22.py
scp "$REPO_ROOT/code/publisher/requirements.txt" $PI_USER@$PI_IP:/home/pi/publisher/
scp "$REPO_ROOT/code/publisher/systemd/picarx-dht22-local-publisher.service" $PI_USER@$PI_IP:/home/pi/publisher/systemd/
scp "$REPO_ROOT/code/publisher/systemd/picarx-dht22-local-publisher.env" $PI_USER@$PI_IP:/home/pi/publisher/systemd/
scp "$REPO_ROOT/code/publisher/systemd/picarx-dht22-remote-publisher.service" $PI_USER@$PI_IP:/home/pi/publisher/systemd/
scp "$REPO_ROOT/code/publisher/systemd/picarx-dht22-remote-publisher.env" $PI_USER@$PI_IP:/home/pi/publisher/systemd/
scp "$REPO_ROOT/code/publisher/install-systemd.sh" $PI_USER@$PI_IP:/home/pi/publisher/

ssh $PI_USER@$PI_IP "chmod +x /home/pi/publisher/publish_picarx_dht22.py /home/pi/publisher/install-systemd.sh"
ssh $PI_USER@$PI_IP "cd /home/pi/publisher && PROFILE=remote ./install-systemd.sh"

echo "✅ Script enviado e configurado"

echo ""
echo "🧪 Testando script manualmente..."

# Testar o script por alguns segundos
ssh $PI_USER@$PI_IP "timeout 15 sudo journalctl -u picarx-dht22-remote-publisher -n 20 --no-pager" || echo "Ver journal no Pi"

echo ""
echo "📊 Verificando dados no servidor..."
sleep 5

curl -s "http://200.137.220.50:8080/api/latest/PiCarX-RM520N-DHT22" | jq . || echo "Nenhum dado encontrado ainda"

echo ""
echo "✅ CORREÇÃO CONCLUÍDA!"
echo "======================"
echo "Para executar o script continuamente:"
echo "ssh $PI_USER@$PI_IP 'sudo systemctl status picarx-dht22-remote-publisher'"
