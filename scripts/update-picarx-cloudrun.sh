#!/bin/bash
# Atualiza a URL do Cloud Run no publisher via /etc/default (systemd) e reinicia o serviço.

set -e

PICARX_HOST="picarx.local"
PICARX_USER="pi"
SERVICE_NAME="picarx-dht22-remote-publisher"
DEFAULT_ENV="/etc/default/${SERVICE_NAME}"

echo "=== ATUALIZANDO PicarX PARA CLOUD RUN (systemd + ${DEFAULT_ENV}) ==="

if [ -z "$1" ]; then
    echo "❌ Uso: $0 <URL_DO_CLOUD_RUN>"
    echo "Exemplo: $0 https://dht22-server-xxxxx-uc.a.run.app"
    exit 1
fi

CLOUD_RUN_URL="$1"
PUBLISH_URL="${CLOUD_RUN_URL}/api/ingest"

echo "URL base: ${CLOUD_RUN_URL}"
echo "POST ingest: ${PUBLISH_URL}"
echo ""

echo "Verificando conectividade com PiCarX..."
if ! ping -c 1 "${PICARX_HOST}" &> /dev/null; then
    echo "❌ Não foi possível dar ping em ${PICARX_HOST}"
    exit 1
fi

ssh "${PICARX_USER}@${PICARX_HOST}" "sudo tee ${DEFAULT_ENV} >/dev/null" <<EOFENV
PUBLISH_URL=${PUBLISH_URL}
DEVICE_ID=PiCarX-RM520N-DHT22
READ_INTERVAL_S=2.5
REQUEST_TIMEOUT_S=10
DHT_GPIO_BCM=14
EOFENV

ssh "${PICARX_USER}@${PICARX_HOST}" "sudo systemctl daemon-reload && sudo systemctl restart ${SERVICE_NAME} && sudo systemctl --no-pager status ${SERVICE_NAME}" || true

echo ""
echo "=== CONCLUÍDO ==="
echo "Logs: ssh ${PICARX_USER}@${PICARX_HOST} 'sudo journalctl -u ${SERVICE_NAME} -f'"
echo "curl ${CLOUD_RUN_URL}/api/latest/PiCarX-RM520N-DHT22"
