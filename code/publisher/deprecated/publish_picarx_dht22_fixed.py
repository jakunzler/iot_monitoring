#!/usr/bin/env python3
"""
Script de publicação de dados DHT22 para PiCarX com módulo 5G
Versão corrigida com tratamento de erros e retry
"""

import time
import requests
import logging
import adafruit_dht
import board

# Configurações
SERVER_URL = "http://200.137.220.50:8080"
DEVICE_ID = "PiCarX-RM520N-DHT22"
HEADER_PIN = board.D14
GPIO_PIN = 8
SENSOR_TYPE = adafruit_dht.DHT22
INTERVAL = 30  # Intervalo entre leituras em segundos
MAX_RETRIES = 3
RETRY_DELAY = 5

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/home/pi/publisher/publish_picarx_dht22.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def get_network_info():
    """Obter informações da rede"""
    try:
        import subprocess
        result = subprocess.run(['ip', 'addr', 'show', 'usb0'], 
                              capture_output=True, text=True)
        if 'inet' in result.stdout:
            # Extrair IP do usb0 (módulo 5G)
            for line in result.stdout.split('\n'):
                if 'inet' in line and 'usb0' in result.stdout:
                    ip = line.split()[1].split('/')[0]
                    return ip
        return "192.168.225.92"  # IP padrão do módulo 5G
    except:
        return "192.168.225.92"

def read_sensor():
    """Ler dados do sensor DHT22"""
    try:
        dht = adafruit_dht.DHT22(HEADER_PIN, use_pulseio=False)
        temperature = dht.temperature
        humidity = dht.humidity
        
        if humidity is not None and temperature is not None:
            return {
                'temperature': round(temperature, 1),
                'humidity': round(humidity, 1),
                'temperature_f': round(temperature * 9/5 + 32, 1)
            }
        else:
            logger.warning("Falha na leitura do sensor")
            return None
            
    except Exception as e:
        logger.error(f"Erro ao ler sensor: {e}")
        return None

def send_data(data):
    """Enviar dados para o servidor"""
    try:
        timestamp = int(time.time())
        network_ip = get_network_info()
        
        payload = {
            'device_id': DEVICE_ID,
            'timestamp': timestamp,
            'sensor_type': 'dht22',
            'temperature': data['temperature'],
            'humidity': data['humidity'],
            'temperature_f': data['temperature_f'],
            'wifi_rssi': -45,  # Valor padrão para módulo 5G
            'wifi_ip': network_ip,
            'uptime_seconds': timestamp,
            'reading_number': int(timestamp % 10000),  # Número sequencial simples
            'module_type': 'PiCarX',
            'connection_type': '5G',
            'gpio_pin': HEADER_PIN
        }
        
        logger.info(f"Enviando dados: Temp={data['temperature']}°C, RH={data['humidity']}%")
        
        response = requests.post(
            f"{SERVER_URL}/api/ingest",
            json=payload,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        if response.status_code == 200:
            logger.info("✅ Dados enviados com sucesso")
            return True
        else:
            logger.error(f"❌ Erro HTTP {response.status_code}: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        logger.error(f"❌ Erro de conexão: {e}")
        return False
    except Exception as e:
        logger.error(f"❌ Erro inesperado: {e}")
        return False

def test_connection():
    """Testar conexão com o servidor"""
    try:
        response = requests.get(f"{SERVER_URL}/api/health", timeout=5)
        if response.status_code == 200:
            logger.info("✅ Conexão com servidor OK")
            return True
        else:
            logger.error(f"❌ Servidor retornou código {response.status_code}")
            return False
    except Exception as e:
        logger.error(f"❌ Erro ao testar conexão: {e}")
        return False

def main():
    """Função principal"""
    logger.info("=== INICIANDO PiCarX DHT22 Publisher ===")
    logger.info(f"Servidor: {SERVER_URL}")
    logger.info(f"Dispositivo: {DEVICE_ID}")
    logger.info(f"GPIO Pin: {HEADER_PIN}")
    logger.info(f"Intervalo: {INTERVAL}s")
    
    # Testar conexão inicial
    if not test_connection():
        logger.error("Não foi possível conectar ao servidor. Verifique a conectividade.")
        return
    
    reading_count = 0
    
    try:
        while True:
            reading_count += 1
            logger.info(f"--- Leitura #{reading_count} ---")
            
            # Ler dados do sensor
            sensor_data = read_sensor()
            
            if sensor_data:
                logger.info(f"Temp: {sensor_data['temperature']}°C, RH: {sensor_data['humidity']}%")
                
                # Tentar enviar dados com retry
                success = False
                for attempt in range(MAX_RETRIES):
                    if send_data(sensor_data):
                        success = True
                        break
                    else:
                        if attempt < MAX_RETRIES - 1:
                            logger.warning(f"Tentativa {attempt + 1} falhou. Tentando novamente em {RETRY_DELAY}s...")
                            time.sleep(RETRY_DELAY)
                
                if not success:
                    logger.error("❌ Falha ao enviar dados após todas as tentativas")
            else:
                logger.warning("⚠️ Dados do sensor inválidos")
            
            # Aguardar próximo ciclo
            logger.info(f"Aguardando {INTERVAL}s para próxima leitura...")
            time.sleep(INTERVAL)
            
    except KeyboardInterrupt:
        logger.info("🛑 Interrompido pelo usuário")
    except Exception as e:
        logger.error(f"❌ Erro inesperado: {e}")
    finally:
        logger.info("=== FINALIZANDO PiCarX DHT22 Publisher ===")

if __name__ == "__main__":
    main()
