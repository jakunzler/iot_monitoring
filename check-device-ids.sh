#!/bin/bash

# Script para verificar todos os device_ids no banco

echo "🔍 Verificando device_ids no servidor..."

ssh cerise@200.137.220.50 << 'EOF'
cd /opt/dht22-server/
python3 -c "
import sqlite3
conn = sqlite3.connect('dht22_data.db')
cursor = conn.cursor()

print('=== TODOS OS DEVICE_IDS ===')
cursor.execute('SELECT DISTINCT device_id, COUNT(*) as count FROM sensor_data GROUP BY device_id ORDER BY count DESC')
devices = cursor.fetchall()
for device_id, count in devices:
    print(f'{device_id}: {count} registros')

print('')
print('=== ÚLTIMOS 5 REGISTROS ===')
cursor.execute('SELECT device_id, timestamp, temperature, humidity, created_at FROM sensor_data ORDER BY timestamp DESC LIMIT 5')
records = cursor.fetchall()
for record in records:
    device_id, timestamp, temp, hum, created_at = record
    print(f'{device_id}: {temp:.1f}°C/{hum:.1f}% - {created_at}')

conn.close()
"
EOF
