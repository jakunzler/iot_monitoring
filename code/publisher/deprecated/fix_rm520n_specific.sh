#!/bin/bash
# Script Específico para RM520N-GL - Resolver Problema de Interface
# Foca no problema específico de interface incorreta

echo "=== CORREÇÃO ESPECÍFICA RM520N-GL ==="

# 1. Limpar TODAS as conexões GSM existentes
echo "1. Limpando todas as conexões GSM..."
sudo nmcli con delete vivo5g 2>/dev/null || true
sudo nmcli con delete rm520n-5g 2>/dev/null || true
sudo nmcli con delete "rm520n-5g" 2>/dev/null || true

# Listar conexões restantes
echo "Conexões restantes:"
nmcli con show

# 2. Verificar interface wwan0
echo "2. Verificando interface wwan0..."
sudo ip link set wwan0 down
sudo ip addr flush dev wwan0
sudo ip link set wwan0 up

# 3. Usar método QMI direto (mais confiável para RM520N-GL)
echo "3. Configurando via QMI..."
if command -v qmicli >/dev/null 2>&1; then
    echo "Usando QMI para conectar..."
    
    # Parar rede existente
    sudo qmicli -d /dev/cdc-wdm0 --wds-stop-network 2>/dev/null || true
    
    # Iniciar rede com APN correto
    sudo qmicli -d /dev/cdc-wdm0 --wds-start-network="apn=zap.vivo.com.br,ip-type=4" --client-no-release-cid
    
    sleep 5
    
    # Obter IP via DHCP
    echo "Obtendo IP via DHCP..."
    sudo dhclient -v wwan0 -t 15
    
    # Verificar se obteve IP
    if ip addr show wwan0 | grep -q "inet "; then
        echo "✅ Interface wwan0 obteve IP via QMI"
        ip addr show wwan0 | grep "inet "
        
        # Testar conectividade
        if ping -I wwan0 -c 3 8.8.8.8 >/dev/null 2>&1; then
            echo "🎉 Conectividade 5G funcionando via QMI!"
        else
            echo "⚠ Interface tem IP mas sem conectividade"
        fi
    else
        echo "❌ Falha ao obter IP via QMI"
    fi
else
    echo "⚠ qmicli não encontrado"
fi

# 4. Se QMI falhar, tentar NetworkManager com configuração específica
if ! ping -I wwan0 -c 2 8.8.8.8 >/dev/null 2>&1; then
    echo "4. Tentando NetworkManager com configuração específica..."
    
    # Criar conexão GSM específica para wwan0
    sudo nmcli con add type gsm ifname wwan0 con-name rm520n-qmi apn zap.vivo.com.br
    sudo nmcli con modify rm520n-qmi gsm.apn zap.vivo.com.br
    sudo nmcli con modify rm520n-qmi gsm.username ""
    sudo nmcli con modify rm520n-qmi gsm.password ""
    sudo nmcli con modify rm520n-qmi connection.interface-name wwan0
    sudo nmcli con modify rm520n-qmi connection.autoconnect no
    sudo nmcli con modify rm520n-qmi ipv4.method auto
    sudo nmcli con modify rm520n-qmi ipv6.method auto
    
    # Ativar conexão
    sudo nmcli con up rm520n-qmi
    
    sleep 10
    
    # Verificar resultado
    if ip addr show wwan0 | grep -q "inet "; then
        echo "✅ Interface wwan0 obteve IP via NetworkManager"
        ip addr show wwan0 | grep "inet "
        
        if ping -I wwan0 -c 3 8.8.8.8 >/dev/null 2>&1; then
            echo "🎉 Conectividade 5G funcionando via NetworkManager!"
        fi
    fi
fi

# 5. Configuração manual como último recurso
if ! ping -I wwan0 -c 2 8.8.8.8 >/dev/null 2>&1; then
    echo "5. Tentando configuração manual..."
    
    # Usar IP fixo que estava funcionando antes
    sudo ip addr add 200.137.220.59/24 dev wwan0
    sudo ip link set wwan0 up
    
    # Configurar rota padrão
    sudo ip route add default via 200.137.220.1 dev wwan0 2>/dev/null || true
    
    if ping -I wwan0 -c 3 8.8.8.8 >/dev/null 2>&1; then
        echo "🎉 Conectividade 5G funcionando com IP fixo!"
        ip addr show wwan0 | grep "inet "
    else
        echo "❌ Falha na conectividade 5G"
    fi
fi

# 6. Teste final e diagnóstico
echo "6. Teste final..."
if ping -I wwan0 -c 3 google.com >/dev/null 2>&1; then
    echo "🎉 RM520N-GL configurado com sucesso!"
    echo "IP da interface wwan0:"
    ip addr show wwan0 | grep "inet "
    
    # Testar envio de dados para o backend
    echo "Testando envio de dados para o servidor..."
    if command -v curl >/dev/null 2>&1; then
        # Tentar encontrar o servidor backend
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
    nmcli con show
fi

echo "=== FIM DA CORREÇÃO ESPECÍFICA ==="
