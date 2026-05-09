#!/bin/bash
# Configura RM520N-GL (wwan0) com DHCP — Vivo APN por defeito.
# Uso: sudo bash configure_rm520n_dhcp.sh
#      APN=internet sudo bash configure_rm520n_dhcp.sh
#
# /etc/mbim-network.conf é interpretado como shell pelo mbim-network — só linhas tipo VAR=valor.
# NÃO uses secções [General] (isso causa os erros "not found" ao fazer source).
#
# Se mbimcli der timeout: MM pode estar a segurar o modem — tenta STOP_MM=1 ou manualmente:
#   sudo systemctl stop ModemManager && ... ; sudo systemctl start ModemManager

APN="${APN:-zappro.vivo.com.br}"
WDM="${WDM:-/dev/cdc-wdm0}"
BACKEND_TEST_URL="${BACKEND_TEST_URL:-}"
STOP_MM="${STOP_MM:-0}"

echo "=== CONFIGURAÇÃO RM520N-GL COM DHCP (APN=$APN) ==="

if [[ "${STOP_MM}" == "1" ]] || [[ "${STOP_MM}" == "yes" ]]; then
  echo "A parar ModemManager (STOP_MM=1) para libertar $WDM..."
  sudo systemctl stop ModemManager 2>/dev/null || true
  sleep 2
fi

echo "Pré-checagem: USB / rfkill / dispositivo MBIM"
lsusb 2>/dev/null | grep -i -e quectel -e wireless -e modem || true
command -v rfkill >/dev/null && rfkill list || true
if [[ ! -e "$WDM" ]]; then
  echo "⚠ $WDM não existe — módulo pode não estar enumerado (cabo/USB, energia, drivers qmi_wwan/cdc_mbim)."
fi

echo "1. Limpando conexões NM antigas (opcional)..."
sudo ip addr flush dev wwan0 2>/dev/null || true
for c in vivo5g rm520n-5g rm520n-final rm520n-qmi rm520n-dhcp; do
  sudo nmcli con delete "$c" 2>/dev/null || true
done

echo "2. Subindo wwan0..."
sudo ip link set wwan0 down 2>/dev/null || true
sudo ip link set wwan0 up
sleep 1

echo "3. Tentativa MBIM + DHCP..."
if [[ -e "$WDM" ]]; then
  # Formato Debian/man: variáveis shell — ver mbim-network(1). Sem [General] e sem hífens nos nomes.
  sudo tee /etc/mbim-network.conf >/dev/null <<EOF
APN=$APN
EOF

  echo "   mbim-network $WDM start"
  sudo mbim-network "$WDM" start || echo "   (mbim-network falhou — pode tentar NM ou QMI abaixo)"
  sleep 5
  echo "   dhclient wwan0..."
  sudo dhclient -v wwan0 -t 30 2>/dev/null || true

  if ip addr show wwan0 | grep -q "inet "; then
    echo "✅ wwan0 tem IPv4 (DHCP)"
    ip -4 addr show wwan0
    if ping -I wwan0 -c 3 8.8.8.8 >/dev/null 2>&1; then
      echo "✅ Ping 8.8.8.8 via wwan0 OK"
    else
      echo "⚠ Tem IP mas ping falhou (DNS/rota/APN/antena)"
    fi
  else
    echo "❌ Sem IPv4 no wwan0 após MBIM"
  fi
else
  echo "⚠ Sem $WDM — a saltar MBIM"
fi

echo "4. Se ainda sem net: NetworkManager (gsm)..."
if ! ping -I wwan0 -c 2 -W 3 8.8.8.8 >/dev/null 2>&1; then
  # Ligar ao modem GSM disponível sem forçar ifname (evita erro "mismatching interface" / eth0).
  sudo nmcli con add type gsm con-name rm520n-dhcp apn "$APN" 2>/dev/null || true
  sudo nmcli con modify rm520n-dhcp gsm.apn "$APN"
  sudo nmcli con modify rm520n-dhcp ipv4.method auto
  sudo nmcli con modify rm520n-dhcp ipv6.method ignore
  sudo nmcli con modify rm520n-dhcp connection.autoconnect no
  sudo nmcli con up rm520n-dhcp || true
  sleep 8
  if ip addr show wwan0 | grep -q "inet "; then
    echo "✅ wwan0 com IP (NM)"
    if ping -I wwan0 -c 3 8.8.8.8 >/dev/null 2>&1; then
      echo "✅ Ping via wwan0 OK (NM)"
    else
      echo "⚠ IP na interface mas sem ping (ver rota/APN)"
    fi
  else
    echo "❌ NM não atribuiu IP"
  fi
fi

echo "5. Se ainda falhar: QMI (qmicli)..."
if ! ping -I wwan0 -c 2 -W 3 8.8.8.8 >/dev/null 2>&1; then
  if command -v qmicli >/dev/null 2>&1 && [[ -e "$WDM" ]]; then
    sudo qmicli -d "$WDM" --wds-stop-network 2>/dev/null || true
    sudo qmicli -d "$WDM" --wds-start-network="apn=$APN,ip-type=4" || true
    sleep 3
    sudo ip link set wwan0 up 2>/dev/null || true
    # Modems Quectel muitas vezes usam Raw IP — necessário antes de DHCP no wwan0
    if [[ -f /sys/class/net/wwan0/qmi/raw_ip ]]; then
      echo 'Y' | sudo tee /sys/class/net/wwan0/qmi/raw_ip >/dev/null
      echo "   raw_ip=Y em wwan0 (QMI)"
    fi
    sleep 2
    sudo dhclient -r wwan0 2>/dev/null || true
    sudo dhclient -v wwan0 -t 45 2>/dev/null || sudo udhcpc -i wwan0 -n -q -t 5 2>/dev/null || true
    if ip addr show wwan0 | grep -q "inet "; then
      echo "✅ wwan0 com IP (QMI)"
      if ping -I wwan0 -c 3 8.8.8.8 >/dev/null 2>&1; then
        echo "✅ Ping via wwan0 OK (QMI)"
      fi
    fi
  fi
fi

echo "6. Estado final"
ip link show wwan0
ip addr show wwan0
echo "Conexões nmcli:"
nmcli con show 2>/dev/null | head -40

if ping -I wwan0 -c 2 -W 3 8.8.8.8 >/dev/null 2>&1; then
  echo "✅ Conectividade móvel (ICMP) OK em wwan0"
  if [[ -n "$BACKEND_TEST_URL" ]] && command -v curl >/dev/null 2>&1; then
    if curl -sS --connect-timeout 8 "$BACKEND_TEST_URL" -o /dev/null; then
      echo "✅ Backend acessível: $BACKEND_TEST_URL"
    else
      echo "⚠ Backend não respondeu: $BACKEND_TEST_URL"
    fi
  fi
else
  echo "❌ Ainda sem ping por wwan0"
  echo "Sugestões: antena/SIM; mmcli -m 0 para PIN; APN da operadora;"
  echo "  sudo STOP_MM=1 APN=$APN bash $0   # parar ModemManager e repetir"
  echo "  sudo dmesg | tail -50            # erros driver/USB"
fi

if [[ "${STOP_MM}" == "1" ]] || [[ "${STOP_MM}" == "yes" ]]; then
  echo "A reiniciar ModemManager..."
  sudo systemctl start ModemManager 2>/dev/null || true
fi

echo "=== FIM ==="
