#!/usr/bin/env python3
"""
Script para Testar Fluxo Completo: DHT22 (Pino 11) → Raspberry Pi → RM520N-GL → Backend
Testa o envio de dados do sensor DHT22 conectado ao pino 11 através do módulo 5G
"""

import RPi.GPIO as GPIO
import adafruit_dht
import board
import requests
import time
import json
from datetime import datetime

# Configurações
DHT_PIN = board.D17  # Pino GPIO BCM 17 (Pino físico 11)
DEVICE_ID = "picarx-rm520n-gl"
BACKEND_URL = "http://192.168.2.10:8080/api/ingest"  # IP do servidor backend
GPIO_PIN = 11  # Pino físico

def read_dht22(pin):
    """Lê dados do sensor DHT22"""
    try:
        # Criar objeto DHT22
        dht = adafruit_dht.DHT22(pin)
        
        # Tentar ler dados com retry
        for attempt in range(3):
            try:
                temperature = dht.temperature
                humidity = dht.humidity
                
                if humidity is not None and temperature is not None:
                    temperature_f = temperature * 9.0 / 5.0 + 32.0
                    return temperature, humidity, temperature_f
                else:
                    time.sleep(1)
                    continue
            except RuntimeError as e:
                print(f"Tentativa {attempt + 1} falhou: {e}")
                time.sleep(1)
                continue
        
        print("❌ Falha na leitura do DHT22 após 3 tentativas")
        return None, None, None
        
    except Exception as e:
        print(f"❌ Erro ao ler DHT22: {e}")
        return None, None, None

def send_data_to_backend(temperature, humidity, temperature_f):
    """Envia dados para o backend via módulo 5G"""
    try:
        payload = {
            "device_id": DEVICE_ID,
            "timestamp": int(time.time()),
            "sensor_type": "DHT22",
            "temperature": temperature,
            "humidity": humidity,
            "temperature_f": temperature_f,
            "metadata": {
                "wifi_rssi": -50,  # Simulado para 5G
                "wifi_ip": "5G.connection",  # Indicador de conexão 5G
                "uptime_seconds": int(time.time()),
                "module_type": "RM520N-GL",
                "connection_type": "5G",
                "gpio_pin": GPIO_PIN
            }
        }
        
        print(f"📤 Enviando dados via 5G: {payload['metadata']['module_type']}")
        print(f"   Temperatura: {temperature:.1f}°C")
        print(f"   Umidade: {humidity:.1f}%")
        print(f"   GPIO Pin: {GPIO_PIN}")
        
        response = requests.post(BACKEND_URL, json=payload, timeout=10)
        
        if response.status_code == 200:
            print("✅ Dados enviados com sucesso via 5G!")
            return True
        else:
            print(f"❌ Erro no envio: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Erro de conexão: {e}")
        return False
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")
        return False

def test_5g_connectivity():
    """Testa conectividade 5G"""
    try:
        print("🔍 Testando conectividade 5G...")
        response = requests.get("http://8.8.8.8", timeout=5)
        print("✅ Conectividade 5G funcionando!")
        return True
    except:
        print("❌ Sem conectividade 5G")
        return False

def main():
    """Função principal"""
    print("=" * 60)
    print("🚀 TESTE FLUXO COMPLETO: DHT22 → Raspberry Pi → RM520N-GL → Backend")
    print("=" * 60)
    
    # Configurar GPIO (adafruit_dht usa board automaticamente)
    GPIO.setwarnings(False)
    
    # Testar conectividade 5G
    if not test_5g_connectivity():
        print("⚠️  Sem conectividade 5G. Continuando mesmo assim...")
    
    print(f"\n📡 Configuração:")
    print(f"   Sensor: DHT22")
    print(f"   GPIO Pin: D17 (BCM) / {GPIO_PIN} (Físico)")
    print(f"   Módulo: RM520N-GL")
    print(f"   Conexão: 5G")
    print(f"   Backend: {BACKEND_URL}")
    
    success_count = 0
    total_attempts = 5
    
    print(f"\n🔄 Iniciando {total_attempts} leituras...")
    
    for i in range(total_attempts):
        print(f"\n--- Leitura {i+1}/{total_attempts} ---")
        
        # Ler sensor
        temperature, humidity, temperature_f = read_dht22(DHT_PIN)
        
        if temperature is not None and humidity is not None:
            # Enviar dados
            if send_data_to_backend(temperature, humidity, temperature_f):
                success_count += 1
            
            # Aguardar antes da próxima leitura
            if i < total_attempts - 1:
                print("⏳ Aguardando 10 segundos...")
                time.sleep(10)
        else:
            print("⚠️  Pulando leitura devido a erro no sensor")
    
    # Resultado final
    print("\n" + "=" * 60)
    print("📊 RESULTADO FINAL")
    print("=" * 60)
    print(f"✅ Sucessos: {success_count}/{total_attempts}")
    print(f"📈 Taxa de sucesso: {(success_count/total_attempts)*100:.1f}%")
    
    if success_count == total_attempts:
        print("🎉 FLUXO COMPLETO FUNCIONANDO PERFEITAMENTE!")
        print("   DHT22 → GPIO11 → Raspberry Pi → RM520N-GL → Backend ✅")
    elif success_count > 0:
        print("⚠️  Fluxo funcionando parcialmente")
    else:
        print("❌ Fluxo com problemas - verificar configurações")
    
    print("\n🔍 Para verificar os dados no dashboard:")
    print("   http://192.168.2.10:8080")
    
    # Limpar GPIO (adafruit_dht gerencia automaticamente)
    print("✅ Teste concluído")

if __name__ == "__main__":
    main()
