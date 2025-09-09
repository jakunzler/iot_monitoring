#!/bin/bash
# Script para Configurar RM520N-GL com DHCP
# Foca apenas em obter IP via DHCP na interface wwan0

echo "=== CONFIGURAÇÃO RM520N-GL COM DHCP ==="

# 1. Limpar configurações existentes
echo "1. Limpando configurações existentes..."
sudo ip addr flush dev wwan0
sudo nmcli con delete vivo5g 2>/dev/null || true
sudo nmcli con delete rm520n-5g 2>/dev/null || true
sudo nmcli con delete rm520n-final 2>/dev/null || true
sudo nmcli con delete rm520n-qmi 2>/dev/null || true

# 2. Configurar interface wwan0
echo "2. Configurando interface wwan0..."
sudo ip link set wwan0 down
sudo ip link set wwan0 up

# 3. Usar MBIM com APN correto
echo "3. Configurando MBIM com APN zappro.vivo.com.br..."
if [ -e /dev/cdc-wdm0 ]; then
    # Criar configuração MBIM
    sudo tee /etc/mbim-network.conf > /dev/null <<EOF
[General]
APN=zappro.vivo.com.br
APN-auth-protocol=none
APN-user=
APN-password=
mbim-proxy=false
EOF
    
    echo "Iniciando rede via MBIM..."
    sudo mbim-network /dev/cdc-wdm0 start
    
    sleep 5
    
    # Tentar DHCP
    echo "Tentando obter IP via DHCP..."
    sudo dhclient -v wwan0 -t 20
    
    # Verificar se obteve IP
    if ip addr show wwan0 | grep -q "inet "; then
        echo "✅ Interface wwan0 obteve IP via DHCP"
        ip addr show wwan0 | grep "inet "
        
        # Testar conectividade
        if ping -I wwan0 -c 3 8.8.8.8 >/dev/null 2>&1; then
            echo "🎉 Conectividade 5G funcionando!"
        else
            echo "⚠ Interface tem IP mas sem conectividade"
        fi
    else
        echo "❌ Falha ao obter IP via DHCP"
    fi
else
    echo "⚠ Dispositivo /dev/cdc-wdm0 não encontrado"
fi

# 4. Se MBIM falhar, tentar NetworkManager
if ! ping -I wwan0 -c 2 8.8.8.8 >/dev/null 2>&1; then
    echo "4. Tentando NetworkManager com DHCP..."
    
    # Criar conexão GSM
    sudo nmcli con add type gsm ifname wwan0 con-name rm520n-dhcp apn zappro.vivo.com.br
    sudo nmcli con modify rm520n-dhcp gsm.apn zappro.vivo.com.br
    sudo nmcli con modify rm520n-dhcp gsm.username ""
    sudo nmcli con modify rm520n-dhcp gsm.password ""
    sudo nmcli con modify rm520n-dhcp connection.interface-name wwan0
    sudo nmcli con modify rm520n-dhcp connection.autoconnect no
    sudo nmcli con modify rm520n-dhcp ipv4.method auto
    sudo nmcli con modify rm520n-dhcp ipv6.method auto
    
    # Ativar conexão
    echo "Ativando conexão GSM..."
    sudo nmcli con up rm520n-dhcp
    
    sleep 10
    
    # Verificar resultado
    if ip addr show wwan0 | grep -q "inet "; then
        echo "✅ Interface wwan0 obteve IP via NetworkManager DHCP"
        ip addr show wwan0 | grep "inet "
        
        if ping -I wwan0 -c 3 8.8.8.8 >/dev/null 2>&1; then
            echo "🎉 Conectividade 5G funcionando via NetworkManager!"
        fi
    else
        echo "❌ Falha ao obter IP via NetworkManager DHCP"
    fi
fi

# 5. Se ainda falhar, tentar QMI
if ! ping -I wwan0 -c 2 8.8.8.8 >/dev/null 2>&1; then
    echo "5. Tentando QMI com DHCP..."
    
    if command -v qmicli >/dev/null 2>&1; then
        # Parar rede existente
        sudo qmicli -d /dev/cdc-wdm0 --wds-stop-network 2>/dev/null || true
        
        # Iniciar rede
        sudo qmicli -d /dev/cdc-wdm0 --wds-start-network="apn=zappro.vivo.com.br,ip-type=4"
        
        sleep 5
        
        # DHCP
        sudo dhclient -v wwan0 -t 15
        
        if ip addr show wwan0 | grep -q "inet "; then
            echo "✅ Interface wwan0 obteve IP via QMI DHCP"
            ip addr show wwan0 | grep "inet "
            
            if ping -I wwan0 -c 3 8.8.8.8 >/dev/null 2>&1; then
                echo "🎉 Conectividade 5G funcionando via QMI!"
            fi
        fi
    fi
fi

# 6. Teste final
echo "6. Teste final..."
if ping -I wwan0 -c 3 google.com >/dev/null 2>&1; then
    echo "🎉 RM520N-GL configurado com sucesso via DHCP!"
    echo "IP da interface wwan0:"
    ip addr show wwan0 | grep "inet "
    
    # Testar envio de dados para o backend
    echo "Testando envio de dados para o servidor..."
    if command -v curl >/dev/null 2>&1; then
        BACKEND_IP="192.168.2.10"  # IP do servidor backend
        if curl -s --connect-timeout 5 "http://${BACKEND_IP}:8080/api/latest" >/dev/null; then
            echo "✅ Backend acessível via 5G"
        else
            echo "⚠ Backend não acessível via 5G"
        fi
    fi
else
    echo "❌ RM520N-GL ainda com problemas"
    echo "Status atual:"
    ip addr show wwan0
    echo "Conexões NetworkManager:"
    nmcli con show
fi

echo "=== FIM DA CONFIGURAÇÃO DHCP ==="
