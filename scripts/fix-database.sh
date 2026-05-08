#!/bin/bash

# Script para corrigir o banco de dados no servidor remoto

echo "🔧 Corrigindo banco de dados no servidor 200.137.220.50..."

# Conectar ao servidor e executar correções
ssh cerise@200.137.220.50 << 'EOF'
echo "=== VERIFICANDO SERVIÇO ATUAL ==="
sudo systemctl status dht22-server --no-pager -l

echo ""
echo "=== PARANDO SERVIÇO ==="
sudo systemctl stop dht22-server

echo ""
echo "=== VERIFICANDO ARQUIVO DO SERVIDOR ==="
ls -la /opt/dht22-server/
cat /opt/dht22-server/server.py | head -20

echo ""
echo "=== CRIANDO BANCO DE DADOS ==="
cd /opt/dht22-server/
python3 -c "
import sqlite3
conn = sqlite3.connect('dht22_data.db')
cursor = conn.cursor()
cursor.execute('''
    CREATE TABLE IF NOT EXISTS sensor_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        sensor_type TEXT NOT NULL,
        temperature REAL,
        humidity REAL,
        temperature_f REAL,
        wifi_rssi INTEGER,
        wifi_ip TEXT,
        uptime_seconds INTEGER,
        reading_number INTEGER,
        module_type TEXT DEFAULT 'ESP32',
        connection_type TEXT DEFAULT 'Wi-Fi',
        gpio_pin INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
''')
conn.commit()
conn.close()
print('Banco de dados criado com sucesso!')
"

echo ""
echo "=== VERIFICANDO TABELA CRIADA ==="
python3 -c "
import sqlite3
conn = sqlite3.connect('dht22_data.db')
cursor = conn.cursor()
cursor.execute('PRAGMA table_info(sensor_data)')
columns = cursor.fetchall()
print('Colunas da tabela sensor_data:')
for col in columns:
    print(f'  {col[1]} ({col[2]})')
conn.close()
"

echo ""
echo "=== REINICIANDO SERVIÇO ==="
sudo systemctl start dht22-server
sleep 3

echo ""
echo "=== VERIFICANDO STATUS ==="
sudo systemctl status dht22-server --no-pager -l

echo ""
echo "=== TESTANDO HEALTH CHECK ==="
curl -s http://localhost:8080/api/health | python3 -m json.tool || echo "Health check falhou"
EOF

echo ""
echo "✅ Correção concluída!"
echo "🌐 Teste o servidor: http://200.137.220.50:8080/api/health"
