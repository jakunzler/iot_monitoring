#!/usr/bin/env bash
#
# Instala ou atualiza o serviço systemd do publisher no PiCarX.
# Rode na Raspberry Pi como usuário pi (sudo será pedido).
#
# Fluxo: copie este diretorio para /home/pi/publisher, depois rode este script.
# Cria um venv em INSTALL_ROOT/.venv (evita erro PEP 668 no Raspberry Pi OS / Debian 12+).
#
# PROFILE=local  → picarx-dht22-local-publisher + /etc/default/picarx-dht22-publisher
# PROFILE=remote → picarx-dht22-remote-publisher + /etc/default/picarx-dht22-remote-publisher
#

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_ROOT="${INSTALL_ROOT:-/home/pi/publisher}"
PROFILE="${PROFILE:-local}"

case "${PROFILE}" in
  local)
    SERVICE_NAME="picarx-dht22-local-publisher"
    SERVICE_FILE="${ROOT}/systemd/${SERVICE_NAME}.service"
    DEFAULT_SRC="${ROOT}/systemd/${SERVICE_NAME}.env"
    DEFAULT_DST="/etc/default/picarx-dht22-publisher"
    OTHER_UNIT="picarx-dht22-remote-publisher"
    ;;
  remote)
    SERVICE_NAME="picarx-dht22-remote-publisher"
    SERVICE_FILE="${ROOT}/systemd/${SERVICE_NAME}.service"
    DEFAULT_SRC="${ROOT}/systemd/${SERVICE_NAME}.env"
    DEFAULT_DST="/etc/default/picarx-dht22-remote-publisher"
    OTHER_UNIT="picarx-dht22-local-publisher"
    ;;
  *)
    echo "❌ PROFILE deve ser «local» ou «remote» (recebido: ${PROFILE})."
    exit 1
    ;;
esac

if [[ ! -f "${ROOT}/publish_picarx_dht22.py" ]]; then
  echo "❌ Esperado '${ROOT}/publish_picarx_dht22.py'. Instale os scripts em ${INSTALL_ROOT} e rode de lá."
  exit 1
fi

if [[ "$(id -u)" -eq 0 ]]; then
  echo "❌ Rode como usuário pi (sem sudo na frente); o script pede sudo só onde precisa."
  exit 1
fi

if [[ ! -f "${SERVICE_FILE}" ]]; then
  echo "❌ Ficheiro não encontrado: ${SERVICE_FILE}"
  exit 1
fi

if [[ ! -f "${DEFAULT_SRC}" ]]; then
  echo "❌ Ficheiro de exemplo não encontrado: ${DEFAULT_SRC}"
  exit 1
fi

VENV="${INSTALL_ROOT}/.venv"
REQ="${ROOT}/requirements.txt"

echo "📋 PROFILE=${PROFILE}  serviço=${SERVICE_NAME}"

echo "🐍 Ambiente virtual: ${VENV}"
if [[ ! -d "${VENV}" ]]; then
  if ! python3 -m venv "${VENV}" 2>/dev/null; then
    echo "❌ Falha ao criar venv. Instale: sudo apt install -y python3-venv python3-full"
    exit 1
  fi
fi
"${VENV}/bin/pip" install --upgrade pip -q
"${VENV}/bin/pip" install -r "${REQ}"

TMP_SVC="$(mktemp)"
sed "s|/home/pi/publisher|${INSTALL_ROOT}|g" "${SERVICE_FILE}" >"${TMP_SVC}"

sudo install -m 644 "${TMP_SVC}" "/etc/systemd/system/${SERVICE_NAME}.service"
rm -f "${TMP_SVC}"

if [[ ! -f "${DEFAULT_DST}" ]]; then
  sudo install -m 644 "${DEFAULT_SRC}" "${DEFAULT_DST}"
  echo "📄 Criado ${DEFAULT_DST} — edite PUBLISH_URL e demais variáveis se necessário."
else
  echo "ℹ️  Mantido ${DEFAULT_DST} existente (não sobrescrito)."
fi

sudo systemctl daemon-reload
sudo systemctl disable --now "${OTHER_UNIT}" 2>/dev/null || true
sudo systemctl disable --now picarx-dht22-publisher 2>/dev/null || true
sudo systemctl enable "${SERVICE_NAME}"
sudo systemctl restart "${SERVICE_NAME}"

echo ""
echo "✅ Serviço instalado (${SERVICE_NAME})."
echo "   O outro publicador («${OTHER_UNIT}») foi desativado para evitar dois processos no mesmo sensor."
echo "   Status:  sudo systemctl status ${SERVICE_NAME}"
echo "   Logs:    sudo journalctl -u ${SERVICE_NAME} -f"
echo ""
