#!/bin/bash

# Publica o código do publisher no PiCarX em /home/pi/publisher,
# instala/atualiza dependências e registra o serviço systemd remoto
# picarx-dht22-remote-publisher (habilitado no boot).

echo "🚀 ATUALIZANDO PiCarX (publisher + systemd)"
echo "=========================================="

PI_IP="10.105.174.64"  # IP do WiFi (wlan0)
PI_USER="pi"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PUB="$REPO_ROOT/code/publisher"

echo "📡 Conectando ao PiCarX via WiFi ($PI_IP)..."

if ! ping -c 3 $PI_IP > /dev/null 2>&1; then
    echo "❌ PiCarX não acessível via $PI_IP"
    echo "Verifique se o WiFi está conectado e funcionando"
    exit 1
fi

echo "✅ PiCarX acessível"

echo "⏹️ Parando publicadores systemd..."
ssh $PI_USER@$PI_IP "sudo systemctl stop picarx-dht22-publisher picarx-dht22-local-publisher picarx-dht22-remote-publisher 2>/dev/null" || true

echo "💾 Backup do publisher anterior (publisher/ e legacy scripts/)..."
ssh $PI_USER@$PI_IP "
  mkdir -p /home/pi/publisher/systemd
  for f in /home/pi/publisher/publish_picarx_dht22.py /home/pi/scripts/publish_picarx_dht22.py; do
    if [ -f \"\$f\" ]; then
      cp \"\$f\" \"\${f}.backup.$(date +%Y%m%d_%H%M%S)\" 2>/dev/null || true
    fi
  done
"

echo "📤 Enviando publisher e unidade systemd..."
ssh $PI_USER@$PI_IP "mkdir -p /home/pi/publisher/systemd"

scp "$PUB/publish_picarx_dht22.py" $PI_USER@$PI_IP:/home/pi/publisher/publish_picarx_dht22.py
scp "$PUB/requirements.txt" $PI_USER@$PI_IP:/home/pi/publisher/requirements.txt
scp "$PUB/systemd/picarx-dht22-local-publisher.service" $PI_USER@$PI_IP:/home/pi/publisher/systemd/
scp "$PUB/systemd/picarx-dht22-local-publisher.env" $PI_USER@$PI_IP:/home/pi/publisher/systemd/
scp "$PUB/systemd/picarx-dht22-remote-publisher.service" $PI_USER@$PI_IP:/home/pi/publisher/systemd/
scp "$PUB/systemd/picarx-dht22-remote-publisher.env" $PI_USER@$PI_IP:/home/pi/publisher/systemd/
scp "$PUB/install-systemd.sh" $PI_USER@$PI_IP:/home/pi/publisher/

ssh $PI_USER@$PI_IP "chmod +x /home/pi/publisher/install-systemd.sh /home/pi/publisher/publish_picarx_dht22.py"

DEFAULT_URL="${PUBLISH_URL:-http://200.137.220.50:8080/api/ingest}"
ssh $PI_USER@$PI_IP 'sudo tee /etc/default/picarx-dht22-remote-publisher >/dev/null' <<EOFENV
PUBLISH_URL=${DEFAULT_URL}
DEVICE_ID=PiCarX-RM520N-DHT22
READ_INTERVAL_S=2.5
REQUEST_TIMEOUT_S=10
DHT_GPIO_BCM=14
EOFENV

echo "📦 Instalando dependências (venv em /home/pi/publisher/.venv via install-systemd.sh)..."
echo "⚙️ Registrando serviço remoto PROFILE=remote (enable + start)..."
ssh $PI_USER@$PI_IP "cd /home/pi/publisher && PROFILE=remote ./install-systemd.sh"

echo ""
echo "📄 Ajuste a URL do servidor se ainda não fez:"
echo "    ssh $PI_USER@$PI_IP 'sudo nano /etc/default/picarx-dht22-remote-publisher'"
echo ""

echo "⏳ Aguardando primeira leituras..."
sleep 5

echo "✅ Status do serviço:"
ssh $PI_USER@$PI_IP "sudo systemctl status picarx-dht22-remote-publisher --no-pager -l" || true

echo ""
echo "📝 Últimas linhas do journal:"
ssh $PI_USER@$PI_IP "sudo journalctl -u picarx-dht22-remote-publisher --no-pager -l | tail -15"

echo ""
echo "🧪 Amostra na API (opcional)..."
sleep 5
curl -s "http://200.137.220.50:8080/api/latest/PiCarX-RM520N-DHT22" | jq . 2>/dev/null || echo "(sem jq ou sem dados ainda)"

echo ""
echo "✅ CONCLUÍDO"
echo "- Arquivos em: /home/pi/publisher/"
echo "- Serviço: picarx-dht22-remote-publisher (ativo no boot)"
echo "- Logs:    ssh $PI_USER@$PI_IP 'sudo journalctl -u picarx-dht22-remote-publisher -f'"
echo "- Config:   /etc/default/picarx-dht22-remote-publisher"
