#!/bin/bash
# Aplica sessão de dados (ModemManager) e IPv4 na wwan0 a partir do bearer.
# Uso: instalado em /usr/local/sbin e invocado pelo systemd wwan-quectel.service
# Config: /etc/default/wwan-quectel

set -euo pipefail

ENV_FILE=/etc/default/wwan-quectel
if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
fi

APN="${APN:-internet}"
# Métrica da rota default (Linux: valor MENOR = maior prioridade). 50 < 100(eth) → wwan0 preferida.
METRIC="${METRIC:-50}"
IFACE="${WWAN_IF:-wwan0}"
MAX_WAIT_MM="${MAX_WAIT_MM:-120}"
MODEM_INDEX="${MODEM_INDEX:-0}"
BEARER_INDEX="${BEARER_INDEX:-0}"
SET_NM_WWAN_UNMANAGED="${SET_NM_WWAN_UNMANAGED:-0}"
MM_TRIES="${MM_TRIES:-40}"

log() { echo "[wwan-connect] $*"; }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    log "comando em falta: $1"
    exit 1
  }
}

require_cmd mmcli
require_cmd ip

if [[ "${SET_NM_WWAN_UNMANAGED}" == "1" ]] && command -v nmcli >/dev/null 2>&1; then
  nmcli device set "${IFACE}" managed no 2>/dev/null || true
fi

# Esperar modem no ModemManager
found=""
for ((i = 1; i <= MM_TRIES; i++)); do
  if mmcli -L 2>/dev/null | grep -q '/Modem/'; then
    found=1
    break
  fi
  sleep 2
done

if [[ -z "${found}" ]]; then
  log "nenhum modem listado pelo ModemManager após espera"
  exit 1
fi

MM_MODEM=( -m "${MODEM_INDEX}" )

# Limpar endereços antigos (evita 200.137.x ou restos de sessões anteriores)
ip addr flush dev "${IFACE}" 2>/dev/null || true
ip route del default dev "${IFACE}" 2>/dev/null || true

mmcli "${MM_MODEM[@]}" --simple-disconnect 2>/dev/null || true
sleep 2

if ! mmcli "${MM_MODEM[@]}" --simple-connect="apn=${APN}"; then
  log "simple-connect falhou"
  exit 1
fi

# Esperar bearer ligado e IPv4 no mmcli -b <índice>
addr="" pfx="" gw=""
for ((i = 1; i <= 45; i++)); do
  sleep 1
  if ! OUT=$(mmcli -b "${BEARER_INDEX}" 2>/dev/null); then
    continue
  fi
  if ! echo "${OUT}" | grep -Eq 'connected:\s+yes'; then
    continue
  fi
  addr=$(echo "${OUT}" | sed -n 's/.*address:[[:space:]]*\([0-9.]*\).*/\1/p' | head -1)
  pfx=$(echo "${OUT}" | sed -n 's/.*prefix:[[:space:]]*\([0-9][0-9]*\).*/\1/p' | head -1)
  gw=$(echo "${OUT}" | sed -n 's/.*gateway:[[:space:]]*\([0-9.]*\).*/\1/p' | head -1)
  if [[ -n "${addr}" && -n "${pfx}" && -n "${gw}" ]]; then
    break
  fi
done

if [[ -z "${addr}" || -z "${pfx}" || -z "${gw}" ]]; then
  log "não foi possível obter address/prefix/gateway do bearer (ver: mmcli -b ${BEARER_INDEX})"
  exit 1
fi

ip addr flush dev "${IFACE}"
ip addr add "${addr}/${pfx}" dev "${IFACE}"
ip link set "${IFACE}" up

ip route del default via "${gw}" dev "${IFACE}" 2>/dev/null || true
ip route replace default via "${gw}" dev "${IFACE}" metric "${METRIC}" 2>/dev/null || \
  ip route add default via "${gw}" dev "${IFACE}" metric "${METRIC}"

log "OK: ${addr}/${pfx} gw ${gw} dev ${IFACE} metric ${METRIC}"
exit 0
