#!/bin/bash

# Script para atualizar o PiCarX com correções

echo "🚀 ATUALIZANDO PiCarX COM CORREÇÕES"
echo "=================================="

PI_IP="10.105.174.64"  # IP do WiFi (wlan0)
PI_USER="pi"

echo "📡 Conectando ao PiCarX via WiFi ($PI_IP)..."

# Verificar se o Pi está acessível
if ! ping -c 3 $PI_IP > /dev/null 2>&1; then
    echo "❌ PiCarX não acessível via $PI_IP"
    echo "Verifique se o WiFi está conectado e funcionando"
    exit 1
fi

echo "✅ PiCarX acessível"

# Parar serviço atual se estiver rodando
echo "⏹️ Parando serviço atual..."
ssh $PI_USER@$PI_IP "sudo systemctl stop picarx-dht22-publisher" 2>/dev/null || echo "Serviço não estava rodando"

# Fazer backup do script atual
echo "💾 Fazendo backup do script atual..."
ssh $PI_USER@$PI_IP "cp /home/pi/scripts/publish_picarx_dht22.py /home/pi/scripts/publish_picarx_dht22.py.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || echo 'Script não encontrado'"

# Copiar script corrigido
echo "📤 Enviando script corrigido..."
scp publish_picarx_dht22_fixed.py $PI_USER@$PI_IP:/home/pi/scripts/publish_picarx_dht22.py

# Dar permissão de execução
echo "🔧 Configurando permissões..."
ssh $PI_USER@$PI_IP "chmod +x /home/pi/scripts/publish_picarx_dht22.py"

# Instalar dependências se necessário
echo "📦 Verificando dependências..."
ssh $PI_USER@$PI_IP "python3 -c 'import Adafruit_DHT, requests' 2>/dev/null || echo 'Instalando dependências...' && pip3 install Adafruit-DHT requests"

# Criar arquivo de serviço systemd se não existir
echo "⚙️ Configurando serviço systemd..."
ssh $PI_USER@$PI_IP "sudo tee /etc/systemd/system/picarx-dht22-publisher.service > /dev/null << 'EOF'
[Unit]
Description=PiCarX DHT22 Data Publisher
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/scripts
ExecStart=/usr/bin/python3 /home/pi/scripts/publish_picarx_dht22.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF"

# Recarregar systemd e habilitar serviço
echo "🔄 Configurando serviço..."
ssh $PI_USER@$PI_IP "sudo systemctl daemon-reload"
ssh $PI_USER@$PI_IP "sudo systemctl enable picarx-dht22-publisher"

# Iniciar serviço
echo "▶️ Iniciando serviço..."
ssh $PI_USER@$PI_IP "sudo systemctl start picarx-dht22-publisher"

# Aguardar inicialização
echo "⏳ Aguardando inicialização..."
sleep 5

# Verificar status
echo "✅ Verificando status do serviço..."
ssh $PI_USER@$PI_IP "sudo systemctl status picarx-dht22-publisher --no-pager -l"

# Verificar logs
echo "📝 Verificando logs..."
ssh $PI_USER@$PI_IP "sudo journalctl -u picarx-dht22-publisher --no-pager -l | tail -10"

# Testar envio de dados
echo "🧪 Testando envio de dados..."
sleep 10

echo "📊 Verificando dados no servidor..."
curl -s "http://200.137.220.50:8080/api/latest/PiCarX-RM520N-DHT22" | jq . || echo "Nenhum dado encontrado ainda"

echo ""
echo "✅ ATUALIZAÇÃO CONCLUÍDA!"
echo "========================="
echo "O PiCarX foi atualizado com:"
echo "- Script corrigido com tratamento de erros"
echo "- Retry automático em caso de falha"
echo "- Logs detalhados"
echo "- Serviço systemd configurado"
echo ""
echo "Para monitorar os logs em tempo real:"
echo "ssh $PI_USER@$PI_IP 'sudo journalctl -u picarx-dht22-publisher -f'"
echo ""
echo "Para verificar status:"
echo "ssh $PI_USER@$PI_IP 'sudo systemctl status picarx-dht22-publisher'"
