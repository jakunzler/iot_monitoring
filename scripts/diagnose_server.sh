#!/bin/bash
# Script para diagnosticar e corrigir problemas

echo "=== DIAGNÓSTICO DO SERVIDOR DHT22 ==="

# Verificar logs
echo "=== LOGS DO SERVIÇO ==="
sudo journalctl -u dht22-server -n 10 --no-pager

echo ""
echo "=== VERIFICANDO ARQUIVO ==="
ls -la /opt/dht22-server/server.py

echo ""
echo "=== TESTANDO ARQUIVO MANUALMENTE ==="
cd /opt/dht22-server
python3 -c "import server; print('server.py OK')" 2>&1 || echo "Erro ao importar server.py"

echo ""
echo "=== VERIFICANDO DEPENDÊNCIAS ==="
python3 -c "import flask, flask_cors; print('Dependências OK')" 2>&1 || echo "Erro nas dependências"

echo ""
echo "=== TESTANDO SERVIDOR SIMPLES ==="
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC_BACKEND="${DHT22_BACKEND_ROOT:-$REPO_ROOT/code/backend}"
cd "$SRC_BACKEND" || exit 1
python3 -c "
from flask import Flask
app = Flask(__name__)
@app.route('/')
def hello():
    return 'Hello World!'
print('Flask OK')
"

echo ""
echo "=== CORRIGINDO SERVIÇO ==="
sudo cp "$SRC_BACKEND/server.py" /opt/dht22-server/server.py
sudo systemctl restart dht22-server
sleep 3
sudo systemctl status dht22-server --no-pager

echo ""
echo "=== TESTANDO CONECTIVIDADE ==="
curl -s http://localhost:8080/ || echo "Servidor não responde"
