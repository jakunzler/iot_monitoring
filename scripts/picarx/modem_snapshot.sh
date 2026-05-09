#!/bin/bash
#
# Relatório único para comparar dois hosts (ex.: Ubuntu no Galaxy Book vs PiCarX)
# e ver se diferenças de modem/USB/QMI explicam bloqueios no Pi.
#
# Uso (em CADA máquina):
#   bash modem_snapshot.sh | tee snapshot-$(hostname)-$(date +%Y%m%d-%H%M).txt
#
# Depois: diff snapshot-book.txt snapshot-picarx.txt

set -euo pipefail

hr() { echo "=============================================="; }

echo "HOST: $(hostname)"
echo "DATE: $(date -Iseconds 2>/dev/null || date)"
echo "KERNEL: $(uname -r)"
hr

echo "### SO / release"
if [[ -f /etc/os-release ]]; then
  grep -E '^(NAME|VERSION|VERSION_ID|ID)=' /etc/os-release
else
  lsb_release -a 2>/dev/null || true
fi
hr

echo "### USB Quectel"
lsusb 2>/dev/null | grep -iE 'quectel|2c7c' || echo "(nenhum match lsusb)"
hr

echo "### Dispositivos QMI / serial"
for p in /dev/cdc-wdm0 /dev/ttyUSB0 /dev/ttyUSB1 /dev/ttyUSB2 /dev/ttyUSB3 /dev/ttyUSB4; do
  [[ -e "$p" ]] && ls -l "$p" || true
done
hr

echo "### Driver / sysfs wwan (se existir)"
for n in wwan0 usb0; do
  if [[ -d "/sys/class/net/$n" ]]; then
    echo "--- /sys/class/net/$n"
    echo "operstate: $(cat "/sys/class/net/$n/operstate" 2>/dev/null || echo n/a)"
    if [[ -f "/sys/class/net/$n/qmi/raw_ip" ]]; then
      echo "raw_ip: $(cat "/sys/class/net/$n/qmi/raw_ip")"
    else
      echo "raw_ip: (ficheiro não existe — pode não ser QMI raw nesta iface)"
    fi
  fi
done
hr

echo "### Interfaces (resumo)"
ip -br link 2>/dev/null || ip link show
hr

echo "### IPv4 wwan0 / usb0"
for n in wwan0 usb0; do
  if ip link show "$n" &>/dev/null; then
    echo "--- $n"
    ip -4 addr show dev "$n" 2>/dev/null || true
  fi
done
hr

echo "### Rotas default"
ip route show default 2>/dev/null || true
hr

echo "### ModemManager"
if systemctl is-active ModemManager &>/dev/null; then
  echo "active: yes"
  systemctl --no-pager -l status ModemManager 2>/dev/null | head -15 || true
else
  echo "active: no (ou unit não instalada)"
fi
if command -v mmcli &>/dev/null; then
  echo "--- mmcli -L"
  mmcli -L 2>/dev/null || true
  M="$(mmcli -L 2>/dev/null | sed -n 's|^.*/Modem/\([0-9]\+\).*|\1|p' | head -1)"
  if [[ -n "${M:-}" ]]; then
    echo "--- mmcli -m $M (exceto números sensíveis em copiar)"
    mmcli -m "$M" 2>/dev/null | head -80 || true
  fi
fi
hr

echo "### qmicli (precisa /dev/cdc-wdm0 e sudo para a maioria)"
WDM="${WDM:-/dev/cdc-wdm0}"
if [[ -e "$WDM" ]] && command -v qmicli &>/dev/null; then
  sudo qmicli -d "$WDM" --device-version 2>/dev/null && true || echo "(device-version falhou)"
  echo "--- packet service status"
  sudo qmicli -d "$WDM" --wds-get-packet-service-status 2>/dev/null || true
  echo "--- get current settings (pode OutOfCall se sem sessão)"
  sudo qmicli -d "$WDM" --wds-get-current-settings 2>/dev/null || true
else
  echo "qmicli ou $WDM indisponível — salta QMI"
fi
hr

echo "### Pacotes relevantes (dpkg)"
for pkg in libqmi-utils modemmanager minicom libmbim-utils; do
  dpkg -l "$pkg" 2>/dev/null | tail -1 || echo "$pkg: não instalado"
done
hr

echo "### Próximo passo manual (minicom, MESMA porta AT nos dois — ex. ttyUSB2)"
echo "Correr e anexar ao relatório:"
echo "  ATI"
echo "  AT+QCFG=\"usbnet\""
echo "  AT+CGDCONT?"
echo "  AT+C5GREG?"
echo ""
echo "Alvo de alinhamento típico:"
echo "  1) Mesma revisão firmware (ATI) se possível"
echo "  2) Mesmo AT+QCFG=\"usbnet\" (ex. 3=QMI em ambos para wwan0 + qmicli)"
echo "  3) Mesmo APN no contexto 1 (+CGDCONT) e no qmi-network.conf / qmicli"
echo "  4) No Pi: evitar dois clientes QMI a competir — preferir qmi-network OU MM, não qmicli start+exit solto"
hr
