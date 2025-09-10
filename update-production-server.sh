#!/bin/bash

# Script para atualizar o servidor de produção com correções

echo "🔄 Atualizando servidor de produção com correções..."

# Configurações
SERVER_IP="200.137.220.50"
SERVER_USER="cerise"
SERVER_PATH="/opt/dht22-server"

echo "📡 Conectando ao servidor $SERVER_IP..."

# Parar o serviço
echo "⏹️ Parando serviço..."
ssh $SERVER_USER@$SERVER_IP "sudo systemctl stop dht22-server"

# Fazer backup
echo "💾 Fazendo backup..."
ssh $SERVER_USER@$SERVER_IP "cp $SERVER_PATH/server_production.py $SERVER_PATH/server_production.py.backup.$(date +%Y%m%d_%H%M%S)"

# Copiar arquivo corrigido
echo "📤 Enviando arquivo corrigido..."
scp backend/server_production.py $SERVER_USER@$SERVER_IP:$SERVER_PATH/server_production.py

# Corrigir permissões
echo "🔧 Corrigindo permissões..."
ssh $SERVER_USER@$SERVER_IP "sudo chown cerise:cerise $SERVER_PATH/server_production.py && chmod +x $SERVER_PATH/server_production.py"

# Criar diretório de logs se não existir
echo "📁 Criando diretório de logs..."
ssh $SERVER_USER@$SERVER_IP "sudo mkdir -p /var/log/dht22-server && sudo chown cerise:cerise /var/log/dht22-server"

# Reiniciar serviço
echo "▶️ Reiniciando serviço..."
ssh $SERVER_USER@$SERVER_IP "sudo systemctl start dht22-server"

# Aguardar inicialização
echo "⏳ Aguardando inicialização..."
sleep 5

# Verificar status
echo "✅ Verificando status..."
ssh $SERVER_USER@$SERVER_IP "sudo systemctl status dht22-server --no-pager -l"

echo ""
echo "🧪 Testando endpoints..."

# Testar health check
echo "📊 Health check:"
ssh $SERVER_USER@$SERVER_IP "curl -s http://localhost:8080/api/health | python3 -m json.tool || echo 'Health check falhou'"

# Testar endpoint de limpeza
echo ""
echo "🗑️ Testando endpoint de limpeza:"
ssh $SERVER_USER@$SERVER_IP "curl -X POST http://localhost:8080/api/clear -H 'Content-Type: application/json' -d '{}' | python3 -m json.tool || echo 'Teste de limpeza falhou'"

echo ""
echo "✅ Servidor atualizado com sucesso!"
echo "🌐 Acesse: http://$SERVER_IP:8080"
