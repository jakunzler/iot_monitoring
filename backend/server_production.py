#!/usr/bin/env python3
"""
Servidor Flask de produção para receber dados do DHT22 ESP32
Configurado para máquina com IP fixo 200.137.220.50
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from datetime import datetime
import sqlite3
import os
import logging
from pathlib import Path

app = Flask(__name__)
CORS(app)  # Habilitar CORS para todas as rotas

# Configurações de produção
DATABASE_FILE = "/opt/dht22-server/dht22_data.db"
DASHBOARD_FILE = Path(__file__).parent / "dashboard" / "index.html"
MAX_RECORDS = 1000  # Mais registros para produção
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# Configurar logging
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/var/log/dht22-server/server.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Criar banco de dados SQLite
def init_database():
    """Inicializa o banco de dados"""
    try:
        # Criar diretório se não existir
        os.makedirs(os.path.dirname(DATABASE_FILE), exist_ok=True)
        
        conn = sqlite3.connect(DATABASE_FILE)
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
        
        # Criar índices para melhor performance
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_device_timestamp 
            ON sensor_data(device_id, timestamp DESC)
        ''')
        
        conn.commit()
        conn.close()
        logger.info("Banco de dados inicializado com sucesso")
        
    except Exception as e:
        logger.error(f"Erro ao inicializar banco de dados: {e}")
        raise

# Inicializar banco
init_database()

@app.route('/')
def index():
    """Servir dashboard HTML"""
    try:
        if DASHBOARD_FILE.exists():
            return send_file(str(DASHBOARD_FILE))
        else:
            return jsonify({
                'message': 'DHT22 Data Server',
                'version': '1.0.0',
                'endpoints': {
                    'ingest': '/api/ingest',
                    'latest': '/api/latest/<device_id>',
                    'history': '/api/history/<device_id>',
                    'stats': '/api/stats/<device_id>'
                }
            })
    except Exception as e:
        logger.error(f"Erro ao servir dashboard: {e}")
        return jsonify({'error': 'Erro interno'}), 500

@app.route('/api/ingest', methods=['POST'])
def ingest_data():
    """Receber dados do DHT22"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Dados JSON obrigatórios'}), 400
        
        # Detectar formato dos dados (novo ou antigo)
        if 'sensor' in data and 'data' in data:
            # Formato novo: dados aninhados
            device_id = data['device_id']
            timestamp = data['timestamp']
            sensor_type = data['sensor']
            sensor_data = data['data']
            metadata = data.get('metadata', {})
            reading_number = data.get('reading_number', 0)
            
            # Validar dados do sensor
            if 'temperature' not in sensor_data or 'humidity' not in sensor_data:
                return jsonify({'error': 'Dados de temperatura e umidade obrigatórios'}), 400
            
            temperature = sensor_data['temperature']
            humidity = sensor_data['humidity']
            temperature_f = sensor_data.get('temperature_f', temperature * 9/5 + 32)
            
        elif 'sensor_type' in data and 'temperature' in data:
            # Formato antigo: dados no nível raiz
            device_id = data['device_id']
            timestamp = data['timestamp']
            sensor_type = data['sensor_type']
            temperature = data['temperature']
            humidity = data['humidity']
            temperature_f = data.get('temperature_f', temperature * 9/5 + 32)
            reading_number = data.get('reading_number', 0)
            
            # Criar metadata a partir dos campos antigos
            metadata = {
                'wifi_rssi': data.get('wifi_rssi', "N/A"),
                'wifi_ip': data.get('wifi_ip', "N/A"),
                'uptime_seconds': data.get('uptime_seconds', timestamp),
                'module_type': data.get('module_type', 'ESP32'),
                'connection_type': data.get('connection_type', 'Wi-Fi'),
                'gpio_pin': data.get('gpio_pin', "N/A")
            }
            
        else:
            return jsonify({'error': 'Formato de dados não reconhecido'}), 400
        
        # Validar dados
        if not device_id or not timestamp:
            return jsonify({'error': 'device_id e timestamp obrigatórios'}), 400
        
        if not isinstance(temperature, (int, float)) or not isinstance(humidity, (int, float)):
            return jsonify({'error': 'Temperatura e umidade devem ser números'}), 400
        
        # Log da leitura recebida
        logger.info(f"Leitura recebida [{device_id}] -> temperatura: {temperature:.1f}°C e umidade: {humidity:.1f}%")
        
        # Salvar no banco
        conn = sqlite3.connect(DATABASE_FILE)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO sensor_data 
            (device_id, timestamp, sensor_type, temperature, humidity, temperature_f,
             wifi_rssi, wifi_ip, uptime_seconds, reading_number, module_type, connection_type, gpio_pin)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            device_id, timestamp, sensor_type, temperature, humidity, temperature_f,
            metadata.get('wifi_rssi', "N/A"), metadata.get('wifi_ip', "N/A"),
            metadata.get('uptime_seconds'), reading_number,
            metadata.get('module_type', 'ESP32'), metadata.get('connection_type', 'Wi-Fi'),
            metadata.get('gpio_pin', "N/A")
        ))
        conn.commit()
        conn.close()
        
        # Limpar registros antigos se necessário
        cleanup_old_records()
        
        return jsonify({
            'status': 'success',
            'message': 'Dados recebidos com sucesso',
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao processar dados: {e}")
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@app.route('/api/latest/<device_id>')
def get_latest(device_id):
    """Obter dados mais recentes de um dispositivo"""
    try:
        conn = sqlite3.connect(DATABASE_FILE)
        cursor = conn.cursor()
        cursor.execute('''
            SELECT * FROM sensor_data 
            WHERE device_id = ? 
            ORDER BY timestamp DESC 
            LIMIT 1
        ''', (device_id,))
        
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return jsonify({
                'device_id': row[1],
                'timestamp': row[2],
                'sensor_type': row[3],
                'data': {
                    'temperature': row[4],
                    'humidity': row[5],
                    'temperature_f': row[6]
                },
                'metadata': {
                    'wifi_rssi': row[7] if row[7] is not None else "N/A",
                    'wifi_ip': row[8] if row[8] is not None else "N/A",
                    'uptime_seconds': row[9] if row[9] is not None else 0,
                    'module_type': row[12] if len(row) > 12 else 'ESP32',
                    'connection_type': row[13] if len(row) > 13 else 'Wi-Fi',
                    'gpio_pin': row[14] if len(row) > 14 else None
                },
                'reading_number': row[10],
                'created_at': row[15] if len(row) > 15 else datetime.now().isoformat()
            })
        else:
            return jsonify({'error': 'Nenhum dado encontrado'}), 404
            
    except Exception as e:
        logger.error(f"Erro ao buscar dados mais recentes: {e}")
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@app.route('/api/history/<device_id>')
def get_history(device_id):
    """Obter histórico de dados de um dispositivo"""
    try:
        limit = request.args.get('limit', 50, type=int)
        limit = min(limit, 100)  # Máximo 100 registros
        
        conn = sqlite3.connect(DATABASE_FILE)
        cursor = conn.cursor()
        cursor.execute('''
            SELECT * FROM sensor_data 
            WHERE device_id = ? 
            ORDER BY timestamp DESC 
            LIMIT ?
        ''', (device_id, limit))
        
        rows = cursor.fetchall()
        conn.close()
        
        data = []
        for row in rows:
            data.append({
                'device_id': row[1],
                'timestamp': row[2],
                'sensor_type': row[3],
                'data': {
                    'temperature': row[4],
                    'humidity': row[5],
                    'temperature_f': row[6]
                },
                'metadata': {
                    'wifi_rssi': row[7] if row[7] is not None else "N/A",
                    'wifi_ip': row[8] if row[8] is not None else "N/A",
                    'uptime_seconds': row[9] if row[9] is not None else 0,
                    'module_type': row[12] if len(row) > 12 else 'ESP32',
                    'connection_type': row[13] if len(row) > 13 else 'Wi-Fi',
                    'gpio_pin': row[14] if len(row) > 14 else None
                },
                'reading_number': row[10],
                'created_at': row[15] if len(row) > 15 else datetime.now().isoformat()
            })
        
        return jsonify(data)
        
    except Exception as e:
        logger.error(f"Erro ao buscar histórico: {e}")
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@app.route('/api/stats/<device_id>')
def get_stats(device_id):
    """Obter estatísticas de um dispositivo"""
    try:
        conn = sqlite3.connect(DATABASE_FILE)
        cursor = conn.cursor()
        
        # Estatísticas gerais
        cursor.execute('''
            SELECT 
                COUNT(*) as total_readings,
                AVG(temperature) as avg_temperature,
                AVG(humidity) as avg_humidity,
                MIN(temperature) as min_temperature,
                MAX(temperature) as max_temperature,
                MIN(humidity) as min_humidity,
                MAX(humidity) as max_humidity,
                MIN(timestamp) as first_reading,
                MAX(timestamp) as last_reading
            FROM sensor_data 
            WHERE device_id = ?
        ''', (device_id,))
        
        stats = cursor.fetchone()
        conn.close()
        
        if stats[0] > 0:
            return jsonify({
                'device_id': device_id,
                'total_readings': stats[0],
                'avg_temperature': round(stats[1], 2),
                'avg_humidity': round(stats[2], 2),
                'min_temperature': stats[3],
                'max_temperature': stats[4],
                'min_humidity': stats[5],
                'max_humidity': stats[6],
                'first_reading': stats[7],
                'last_reading': stats[8],
                'uptime_seconds': stats[8] - stats[7] if stats[8] and stats[7] else 0
            })
        else:
            return jsonify({'error': 'Nenhum dado encontrado'}), 404
            
    except Exception as e:
        logger.error(f"Erro ao buscar estatísticas: {e}")
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@app.route('/api/clear', methods=['POST'])
def clear_database():
    """Limpar todos os registros do banco de dados"""
    try:
        conn = sqlite3.connect(DATABASE_FILE)
        cursor = conn.cursor()
        
        # Contar registros antes de limpar
        cursor.execute('SELECT COUNT(*) FROM sensor_data')
        count_before = cursor.fetchone()[0]
        
        # Limpar todos os registros
        cursor.execute('DELETE FROM sensor_data')
        conn.commit()
        
        # Resetar o auto-increment
        cursor.execute('DELETE FROM sqlite_sequence WHERE name="sensor_data"')
        conn.commit()
        
        conn.close()
        
        logger.info(f"Banco de dados limpo: {count_before} registros removidos")
        
        return jsonify({
            'status': 'success',
            'message': f'Banco de dados limpo com sucesso. {count_before} registros removidos.',
            'records_removed': count_before,
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao limpar banco: {e}")
        return jsonify({'error': f'Erro ao limpar banco: {str(e)}'}), 500

@app.route('/api/health')
def health_check():
    """Endpoint de health check"""
    try:
        conn = sqlite3.connect(DATABASE_FILE)
        cursor = conn.cursor()
        cursor.execute('SELECT COUNT(*) FROM sensor_data')
        count = cursor.fetchone()[0]
        conn.close()
        
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'database_records': count,
            'version': '1.0.0'
        })
    except Exception as e:
        logger.error(f"Erro no health check: {e}")
        return jsonify({'status': 'unhealthy', 'error': str(e)}), 500

def cleanup_old_records():
    """Limpar registros antigos mantendo apenas os mais recentes"""
    try:
        conn = sqlite3.connect(DATABASE_FILE)
        cursor = conn.cursor()
        
        # Contar registros
        cursor.execute('SELECT COUNT(*) FROM sensor_data')
        count = cursor.fetchone()[0]
        
        if count > MAX_RECORDS:
            # Manter apenas os registros mais recentes
            cursor.execute('''
                DELETE FROM sensor_data 
                WHERE id NOT IN (
                    SELECT id FROM sensor_data 
                    ORDER BY timestamp DESC 
                    LIMIT ?
                )
            ''', (MAX_RECORDS,))
            
            conn.commit()
            logger.info(f"Limpeza: removidos {count - MAX_RECORDS} registros antigos")
        
        conn.close()
        
    except Exception as e:
        logger.error(f"Erro na limpeza: {e}")

if __name__ == '__main__':
    logger.info("=== SERVIDOR DHT22 ESP32 (PRODUÇÃO) ===")
    logger.info(f"Dashboard: http://0.0.0.0:8080")
    logger.info(f"API: http://0.0.0.0:8080/api/ingest")
    logger.info(f"Banco de dados: {DATABASE_FILE}")
    logger.info("=" * 50)
    
    # Iniciar servidor Flask
    app.run(host='0.0.0.0', port=8080, debug=False)
