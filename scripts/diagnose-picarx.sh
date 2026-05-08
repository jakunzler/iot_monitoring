#!/bin/bash

# Script para diagnosticar e corrigir problemas do PiCarX

echo "🔍 DIAGNÓSTICO DO PiCarX"
echo "========================"

# Configurações
SERVER_URL="http://200.137.220.50:8080"
DEVICE_ID="PiCarX-RM520N-DHT22"

echo ""
echo "📡 1. VERIFICANDO CONECTIVIDADE"
echo "==============================="

# Testar conectividade com o servidor
echo "Testando conectividade com o servidor..."
if ping -c 3 200.137.220.50 > /dev/null 2>&1; then
    echo "✅ Servidor acessível via ping"
else
    echo "❌ Servidor não acessível via ping"
fi

# Testar HTTP
echo "Testando acesso HTTP ao servidor..."
HTTP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$SERVER_URL/api/health")
if [ "$HTTP_RESPONSE" = "200" ]; then
    echo "✅ Servidor HTTP funcionando (código: $HTTP_RESPONSE)"
else
    echo "❌ Servidor HTTP com problemas (código: $HTTP_RESPONSE)"
fi

echo ""
echo "📊 2. VERIFICANDO DADOS NO SERVIDOR"
echo "==================================="

# Verificar dados existentes
echo "Verificando dados do PiCarX no servidor..."
LATEST_DATA=$(curl -s "$SERVER_URL/api/latest/$DEVICE_ID")
if echo "$LATEST_DATA" | grep -q "error"; then
    echo "❌ Nenhum dado do PiCarX encontrado no servidor"
else
    echo "✅ Dados do PiCarX encontrados no servidor"
    echo "$LATEST_DATA" | python3 -m json.tool 2>/dev/null || echo "$LATEST_DATA"
fi

echo ""
echo "🔧 3. VERIFICANDO SCRIPTS LOCAIS"
echo "================================"

if [ -f "/home/pi/publisher/publish_picarx_dht22.py" ]; then
    echo "✅ Publisher publish_picarx_dht22.py encontrado (/home/pi/publisher)"

    if [ -x "/home/pi/publisher/publish_picarx_dht22.py" ]; then
        echo "✅ Publisher tem permissão de execução"
    else
        echo "❌ Publisher sem execução; corrigindo…"
        chmod +x /home/pi/publisher/publish_picarx_dht22.py
    fi
elif [ -f "/home/pi/scripts/publish_picarx_dht22.py" ]; then
    echo "⚠️  Publisher legado em /home/pi/scripts/ (migrar para /home/pi/publisher/)"
else
    echo "❌ publish_picarx_dht22.py não encontrado em /home/pi/publisher/"
fi

echo "Arquivos em /home/pi/publisher/:"
ls -la /home/pi/publisher/ 2>/dev/null | head -20 || echo "Diretório não encontrado"

echo ""
echo "⚙️ 4. VERIFICANDO SERVIÇOS"
echo "==========================="

# Verificar serviço systemd
if systemctl is-active --quiet picarx-dht22-publisher; then
    echo "✅ Serviço picarx-dht22-publisher está ativo"
else
    echo "❌ Serviço picarx-dht22-publisher não está ativo"
    echo "Status do serviço:"
    systemctl status picarx-dht22-publisher --no-pager -l
fi

# Verificar processos Python
echo "Processos Python rodando:"
ps aux | grep python | grep -v grep || echo "Nenhum processo Python encontrado"

echo ""
echo "📝 5. VERIFICANDO LOGS"
echo "====================="

# Verificar logs do serviço
if [ -f "/var/log/picarx-dht22-publisher.log" ]; then
    echo "Logs do serviço (últimas 10 linhas):"
    tail -10 /var/log/picarx-dht22-publisher.log
else
    echo "Log do serviço não encontrado"
fi

echo "Logs do serviço (journal, últimas 15 linhas):"
journalctl -u picarx-dht22-publisher -n 15 --no-pager 2>/dev/null || echo "Sem entradas no journal"

if [ -f "/home/pi/publisher/publish_picarx_dht22.log" ]; then
    echo "Arquivo de log (últimas 10 linhas):"
    tail -10 /home/pi/publisher/publish_picarx_dht22.log
fi

echo ""
echo "🧪 6. TESTE DE ENVIO DE DADOS"
echo "============================"

# Criar dados de teste
TIMESTAMP=$(date +%s)
TEMP=32.0
HUMIDITY=35.0

TEST_DATA='{
  "device_id": "'$DEVICE_ID'",
  "timestamp": '$TIMESTAMP',
  "sensor_type": "dht22",
  "temperature": '$TEMP',
  "humidity": '$HUMIDITY',
  "temperature_f": '$(echo "$TEMP * 9/5 + 32" | bc)',
  "wifi_rssi": -45,
  "wifi_ip": "192.168.225.92",
  "uptime_seconds": '$TIMESTAMP',
  "reading_number": 1,
  "module_type": "PiCarX",
  "connection_type": "5G",
  "gpio_pin": 11
}'

echo "Enviando dados de teste..."
RESPONSE=$(curl -X POST "$SERVER_URL/api/ingest" \
  -H "Content-Type: application/json" \
  -d "$TEST_DATA" \
  -w "\nHTTP_CODE:%{http_code}" 2>/dev/null)

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
RESPONSE_BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')

echo "Resposta HTTP: $HTTP_CODE"
echo "Corpo da resposta: $RESPONSE_BODY"

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Teste de envio bem-sucedido!"
    
    echo ""
    echo "Verificando se os dados foram salvos..."
    sleep 2
    curl -s "$SERVER_URL/api/latest/$DEVICE_ID" | python3 -m json.tool 2>/dev/null || echo "Erro ao verificar dados"
else
    echo "❌ Erro no teste de envio"
fi

echo ""
echo "🔧 7. CORREÇÕES SUGERIDAS"
echo "========================"

# Sugestões baseadas nos problemas encontrados
echo "Com base no diagnóstico, aqui estão as correções sugeridas:"

if ! systemctl is-active --quiet picarx-dht22-publisher; then
    echo "1. Iniciar o serviço:"
    echo "   sudo systemctl start picarx-dht22-publisher"
    echo "   sudo systemctl enable picarx-dht22-publisher"
fi

if [ ! -f "/home/pi/publisher/publish_picarx_dht22.py" ]; then
    echo "2. Publisher não encontrado em /home/pi/publisher/ — rode install-systemd ou scripts/update-picarx-fixed.sh"
fi

echo "3. Verificar logs:"
echo "   sudo journalctl -u picarx-dht22-publisher -f"

echo "4. Testar manualmente (mesmo comando do systemd):"
echo "   cd /home/pi/publisher && python3 ./publish_picarx_dht22.py"

echo ""
echo "✅ DIAGNÓSTICO CONCLUÍDO"
