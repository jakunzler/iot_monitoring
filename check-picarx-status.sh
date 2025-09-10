#!/bin/bash

# Script para verificar e corrigir o PiCarX no servidor remoto

echo "🔍 Verificando status do PiCarX no servidor..."

SERVER_IP="200.137.220.50"
SERVER_USER="cerise"

echo "📡 Conectando ao servidor $SERVER_IP..."

# Verificar se há dados do PiCarX no banco
echo "📊 Verificando dados do PiCarX no banco:"
ssh $SERVER_USER@$SERVER_IP "curl -s http://localhost:8080/api/latest/PiCarX-RM520N-DHT22 | python3 -m json.tool || echo 'Nenhum dado encontrado'"

echo ""
echo "📈 Verificando histórico do PiCarX:"
ssh $SERVER_USER@$SERVER_IP "curl -s http://localhost:8080/api/history/PiCarX-RM520N-DHT22 | python3 -m json.tool || echo 'Array vazio'"

echo ""
echo "🔧 Verificando processos do PiCarX:"
ssh $SERVER_USER@$SERVER_IP "ps aux | grep -i picarx || echo 'Nenhum processo PiCarX encontrado'"

echo ""
echo "📁 Verificando scripts do PiCarX:"
ssh $SERVER_USER@$SERVER_IP "ls -la /home/pi/scripts/ | grep -i picarx || echo 'Scripts não encontrados'"

echo ""
echo "📋 Verificando serviços do PiCarX:"
ssh $SERVER_USER@$SERVER_IP "sudo systemctl status picarx-dht22-publisher --no-pager -l || echo 'Serviço não encontrado'"

echo ""
echo "📝 Verificando logs do PiCarX:"
ssh $SERVER_USER@$SERVER_IP "tail -20 /home/pi/scripts/publish_picarx_dht22.log 2>/dev/null || echo 'Log não encontrado'"

echo ""
echo "🌐 Testando conectividade do PiCarX:"
ssh $SERVER_USER@$SERVER_IP "ping -c 3 8.8.8.8 || echo 'Sem conectividade'"

echo ""
echo "📡 Verificando módulo 5G:"
ssh $SERVER_USER@$SERVER_IP "lsusb | grep -i quectel || echo 'Módulo 5G não detectado'"
