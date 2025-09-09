#!/bin/bash
# Script para Resolver Problemas do Módulo RM520N-GL
# Corrige configurações e ativa o módulo 5G no Raspberry Pi 4

echo "=== CORREÇÃO DO MÓDULO RM520N-GL ==="
echo "Resolvendo problemas de configuração..."

# 1. Verificar se o módulo está conectado
echo "1. Verificando módulo RM520N-GL..."
if lsusb | grep -q "2c7c:0801"; then
    echo "✅ Módulo RM520N-GL detectado"
else
    echo "❌ Módulo RM520N-GL não encontrado"
    exit 1
fi

# 2. Parar serviços conflitantes
echo "2. Parando serviços conflitantes..."
sudo systemctl stop ModemManager
sudo systemctl stop NetworkManager
sleep 2

# 3. Limpar configurações antigas
echo "3. Limpando configurações antigas..."
sudo nmcli con delete vivo5g 2>/dev/null || true
sudo nmcli con delete rm520n-5g 2>/dev/null || true

# 4. Reiniciar serviços
echo "4. Reiniciando serviços..."
sudo systemctl start ModemManager
sudo systemctl start NetworkManager
sleep 5

# 5. Verificar dispositivos
echo "5. Verificando dispositivos..."
ls -la /dev/cdc-wdm* 2>/dev/null || echo "⚠ Dispositivos CDC-WDM não encontrados"
ls -la /dev/ttyUSB* 2>/dev/null || echo "⚠ Dispositivos TTYUSB não encontrados"

# 6. Configurar interface wwan0
echo "6. Configurando interface wwan0..."
sudo ip link set wwan0 down
sudo ip addr flush dev wwan0
sudo ip link set wwan0 up

# 7. Configurar MBIM com parâmetros corretos
echo "7. Configurando MBIM com parâmetros corretos..."
if [ -e /dev/cdc-wdm0 ]; then
    echo "Criando configuração MBIM personalizada..."
    
    # Criar arquivo de configuração MBIM
    sudo tee /etc/mbim-network.conf > /dev/null <<EOF
[General]
APN=zappro.vivo.com.br
APN-auth-protocol=none
APN-user=
APN-password=
mbim-proxy=false
EOF
    
    # Tentar conexão com timeout maior
    echo "Iniciando rede via MBIM com timeout estendido..."
    timeout 30 sudo mbim-network /dev/cdc-wdm0 start || echo "⚠ MBIM timeout - tentando método alternativo"
    
    sleep 3
    
    # Verificar se a interface tem IP
    if ! ip addr show wwan0 | grep -q "inet "; then
        echo "Tentando obter IP via DHCP..."
        sudo dhclient -v wwan0 -t 10 || echo "⚠ DHCP falhou"
    fi
else
    echo "⚠ Dispositivo /dev/cdc-wdm0 não encontrado"
fi

# 8. Verificar conectividade
echo "8. Verificando conectividade..."
if ping -I wwan0 -c 2 8.8.8.8 >/dev/null 2>&1; then
    echo "✅ Conectividade 5G funcionando"
    ip addr show wwan0
else
    echo "❌ Sem conectividade 5G"
    echo "Tentando configuração alternativa via NetworkManager..."
    
    # Limpar conexões GSM existentes
    sudo nmcli con delete vivo5g 2>/dev/null || true
    sudo nmcli con delete rm520n-5g 2>/dev/null || true
    
    # Configuração alternativa via NetworkManager com parâmetros específicos
    sudo nmcli con add type gsm ifname wwan0 con-name rm520n-5g apn zap.vivo.com.br
    sudo nmcli con modify rm520n-5g gsm.apn zap.vivo.com.br
    sudo nmcli con modify rm520n-5g gsm.username ""
    sudo nmcli con modify rm520n-5g gsm.password ""
    sudo nmcli con modify rm520n-5g connection.interface-name wwan0
    sudo nmcli con modify rm520n-5g ipv4.method auto
    sudo nmcli con modify rm520n-5g ipv6.method auto
    
    # Tentar ativar a conexão
    echo "Ativando conexão GSM..."
    sudo nmcli con up rm520n-5g
    
    sleep 8
    
    # Verificar se obteve IP
    if ip addr show wwan0 | grep -q "inet "; then
        echo "✅ Interface wwan0 obteve IP"
        ip addr show wwan0 | grep "inet "
        
        # Testar conectividade
        if ping -I wwan0 -c 2 8.8.8.8 >/dev/null 2>&1; then
            echo "✅ Conectividade 5G funcionando via NetworkManager"
        else
            echo "⚠ Interface tem IP mas sem conectividade"
            echo "Tentando configuração manual..."
            
            # Configuração manual como último recurso
            sudo ip addr add 200.137.220.59/24 dev wwan0
            sudo ip link set wwan0 up
            
            if ping -I wwan0 -c 2 8.8.8.8 >/dev/null 2>&1; then
                echo "✅ Conectividade 5G funcionando com IP fixo"
            else
                echo "❌ Falha na conectividade 5G"
            fi
        fi
    else
        echo "❌ Falha na conectividade 5G - sem IP"
    fi
fi

# 9. Diagnóstico detalhado se ainda houver problemas
echo "9. Diagnóstico detalhado..."
if ! ping -I wwan0 -c 2 8.8.8.8 >/dev/null 2>&1; then
    echo "Executando diagnóstico completo..."
    
    # Verificar status do módulo
    echo "Status do módulo:"
    sudo mbimcli -d /dev/cdc-wdm0 --query-registration-state 2>/dev/null || echo "⚠ Erro ao consultar status"
    
    # Verificar interfaces de rede
    echo "Interfaces de rede:"
    ip addr show wwan0
    
    # Verificar conexões NetworkManager
    echo "Conexões NetworkManager:"
    nmcli con show
    
    # Tentar método QMI como último recurso
    echo "Tentando método QMI..."
    if command -v qmicli >/dev/null 2>&1; then
        sudo qmicli -d /dev/cdc-wdm0 --wds-start-network="apn=zap.vivo.com.br" || echo "⚠ QMI falhou"
        sleep 3
        sudo dhclient -v wwan0
    fi
fi

# 10. Teste final
echo "10. Teste final de conectividade..."
if ping -I wwan0 -c 3 google.com >/dev/null 2>&1; then
    echo "🎉 Módulo RM520N-GL configurado com sucesso!"
    echo "IP da interface wwan0:"
    ip addr show wwan0 | grep "inet "
    echo "Testando envio de dados para o servidor..."
    
    # Teste de envio de dados para o backend
    if command -v curl >/dev/null 2>&1; then
        SERVER_IP=$(ip route get 8.8.8.8 | awk '{print $7}' | head -1)
        if curl -s "http://${SERVER_IP}:8080/api/latest" >/dev/null; then
            echo "✅ Backend acessível via 5G"
        else
            echo "⚠ Backend não acessível via 5G"
        fi
    fi
else
    echo "⚠ Módulo RM520N-GL com problemas"
    echo "Verifique:"
    echo "- SIM card inserido e ativo"
    echo "- Antenas conectadas corretamente"
    echo "- APN correto (zap.vivo.com.br)"
    echo "- Cobertura 5G na região"
    echo "- Configurações de firewall"
fi

echo "=== FIM DA CORREÇÃO ==="
