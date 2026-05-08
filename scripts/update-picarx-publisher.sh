#!/bin/bash

# Script para atualizar o publisher no Raspberry Pi

echo "🔄 Atualizando publisher no Raspberry Pi..."

# Configurações
RASPBERRY_IP="10.105.174.64"  # IP do Raspberry Pi (conforme visto nos logs)
RASPBERRY_USER="pi"  # Usuário padrão do Raspberry Pi
SERVER_URL="http://200.137.220.50:8080/api/ingest"

echo "📡 Conectando ao Raspberry Pi em $RASPBERRY_IP..."

# Copiar arquivo atualizado
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PUB="$REPO_ROOT/code/publisher"

ssh $RASPBERRY_USER@$RASPBERRY_IP "mkdir -p /home/pi/publisher/systemd"

scp "$PUB/publish_picarx_dht22.py" $RASPBERRY_USER@$RASPBERRY_IP:/home/pi/publisher/publish_picarx_dht22.py
scp "$PUB/requirements.txt" $RASPBERRY_USER@$RASPBERRY_IP:/home/pi/publisher/requirements.txt
scp "$PUB/systemd/picarx-dht22-local-publisher.service" $RASPBERRY_USER@$RASPBERRY_IP:/home/pi/publisher/systemd/
scp "$PUB/systemd/picarx-dht22-local-publisher.env" $RASPBERRY_USER@$RASPBERRY_IP:/home/pi/publisher/systemd/
scp "$PUB/systemd/picarx-dht22-remote-publisher.service" $RASPBERRY_USER@$RASPBERRY_IP:/home/pi/publisher/systemd/
scp "$PUB/systemd/picarx-dht22-remote-publisher.env" $RASPBERRY_USER@$RASPBERRY_IP:/home/pi/publisher/systemd/
scp "$PUB/install-systemd.sh" $RASPBERRY_USER@$RASPBERRY_IP:/home/pi/publisher/

ssh $RASPBERRY_USER@$RASPBERRY_IP 'sudo tee /etc/default/picarx-dht22-remote-publisher >/dev/null' <<EOFENV
PUBLISH_URL=${SERVER_URL}
DEVICE_ID=PiCarX-RM520N-DHT22
READ_INTERVAL_S=2.5
REQUEST_TIMEOUT_S=10
DHT_GPIO_BCM=14
EOFENV

ssh $RASPBERRY_USER@$RASPBERRY_IP <<'REMOTE'
echo "=== CONFIGURANDO PUBLISHER (systemd + venv, remoto) ==="
chmod +x /home/pi/publisher/publish_picarx_dht22.py /home/pi/publisher/install-systemd.sh
cd /home/pi/publisher && PROFILE=remote ./install-systemd.sh

echo ""
echo "=== STATUS ==="
sudo systemctl status picarx-dht22-remote-publisher --no-pager -l | tail -20
REMOTE

echo ""
echo "✅ Publisher atualizado (serviço picarx-dht22-remote-publisher, inicia no boot)"
echo "📊 Logs: ssh $RASPBERRY_USER@$RASPBERRY_IP 'sudo journalctl -u picarx-dht22-remote-publisher -f'"
