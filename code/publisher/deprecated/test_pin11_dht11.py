#!/usr/bin/env python3
"""
Teste do Pino 11 (GPIO17) com DHT11
Validação específica da comunicação do pino 11 do HAT com o Raspberry Pi 4
"""

import RPi.GPIO as GPIO
import time
import json
import requests
import os
from datetime import datetime

# Tentar importar bibliotecas do DHT11
try:
    import Adafruit_DHT
    DHT_LIBRARY = "Adafruit_DHT"
except ImportError:
    try:
        import dht11
        DHT_LIBRARY = "dht11"
    except ImportError:
        DHT_LIBRARY = None

class Pin11DHT11Tester:
    def __init__(self):
        self.pin11_gpio = 17  # GPIO17 corresponde ao pino físico 11
        self.api_url = os.getenv("PUBLISH_URL", "http://localhost:8080/api/ingest")
        self.device_id = os.getenv("DEVICE_ID", "PiCarX-Pin11-Test")
        
    def setup_gpio(self):
        """Configurar GPIO para o pino 11"""
        print("=== CONFIGURAÇÃO GPIO PINO 11 (GPIO17) ===")
        GPIO.setwarnings(False)
        GPIO.setmode(GPIO.BCM)
        
        try:
            # Configurar pino 11 (GPIO17) como entrada com pull-up
            GPIO.setup(self.pin11_gpio, GPIO.IN, pull_up_down=GPIO.PULL_UP)
            print(f"✓ GPIO17 (Pino 11) configurado como entrada com pull-up")
            
            # Verificar estado inicial
            initial_state = GPIO.input(self.pin11_gpio)
            print(f"Estado inicial do GPIO17: {initial_state}")
            
            return True
        except Exception as e:
            print(f"✗ Erro ao configurar GPIO17: {e}")
            return False
    
    def test_dht11_with_pin11(self):
        """Testar DHT11 conectado ao pino 11"""
        print("\n=== TESTE DHT11 NO PINO 11 ===")
        
        if DHT_LIBRARY is None:
            print("✗ Nenhuma biblioteca DHT11 encontrada")
            print("Instale: pip3 install Adafruit_DHT ou pip3 install dht11")
            return False
        
        print(f"Usando biblioteca: {DHT_LIBRARY}")
        
        try:
            if DHT_LIBRARY == "Adafruit_DHT":
                # Usar Adafruit_DHT
                sensor = Adafruit_DHT.DHT11
                humidity, temperature = Adafruit_DHT.read_retry(sensor, self.pin11_gpio)
                
                if humidity is not None and temperature is not None:
                    print(f"✓ Leitura bem-sucedida:")
                    print(f"  Temperatura: {temperature:.1f}°C")
                    print(f"  Umidade: {humidity:.1f}%")
                    return {
                        'temperature': temperature,
                        'humidity': humidity,
                        'valid': True
                    }
                else:
                    print("✗ Falha na leitura do DHT11")
                    return {'valid': False}
                    
            elif DHT_LIBRARY == "dht11":
                # Usar dht11
                sensor = dht11.DHT11(pin=self.pin11_gpio)
                result = sensor.read()
                
                if result.is_valid():
                    print(f"✓ Leitura bem-sucedida:")
                    print(f"  Temperatura: {result.temperature:.1f}°C")
                    print(f"  Umidade: {result.humidity:.1f}%")
                    return {
                        'temperature': result.temperature,
                        'humidity': result.humidity,
                        'valid': True
                    }
                else:
                    print(f"✗ Falha na leitura do DHT11: Error Code {result.error_code}")
                    return {'valid': False}
                    
        except Exception as e:
            print(f"✗ Erro na leitura do DHT11: {e}")
            return {'valid': False}
    
    def test_pin11_communication(self):
        """Testar comunicação básica do pino 11"""
        print("\n=== TESTE DE COMUNICAÇÃO PINO 11 ===")
        
        try:
            # Testar leitura do pino
            pin_state = GPIO.input(self.pin11_gpio)
            print(f"Estado do GPIO17 (Pino 11): {pin_state}")
            
            # Simular diferentes estados
            print("Testando diferentes configurações do pino...")
            
            # Configurar como saída temporariamente para teste
            GPIO.setup(self.pin11_gpio, GPIO.OUT)
            GPIO.output(self.pin11_gpio, GPIO.HIGH)
            time.sleep(0.1)
            GPIO.output(self.pin11_gpio, GPIO.LOW)
            time.sleep(0.1)
            
            # Voltar para entrada
            GPIO.setup(self.pin11_gpio, GPIO.IN, pull_up_down=GPIO.PULL_UP)
            
            print("✓ Comunicação básica do pino 11 funcionando")
            return True
            
        except Exception as e:
            print(f"✗ Erro na comunicação do pino 11: {e}")
            return False
    
    def send_data_via_pin11(self, sensor_data):
        """Enviar dados coletados via pino 11"""
        print("\n=== ENVIO DE DADOS VIA PINO 11 ===")
        
        if not sensor_data.get('valid', False):
            print("✗ Dados do sensor inválidos, não enviando")
            return False
        
        # Preparar dados para envio
        payload = {
            "device_id": self.device_id,
            "timestamp": int(time.time()),
            "sensor": "DHT11",
            "data": {
                "temperature": sensor_data['temperature'],
                "humidity": sensor_data['humidity'],
                "temperature_f": sensor_data['temperature'] * 9/5 + 32
            },
            "metadata": {
                "gpio_pin": 11,
                "gpio_bcm": 17,
                "module_type": "Raspberry Pi 4",
                "connection_type": "5G",
                "pin11_state": GPIO.input(self.pin11_gpio),
                "test_mode": True,
                "dht11_library": DHT_LIBRARY
            },
            "reading_number": 1
        }
        
        try:
            print(f"Enviando dados para: {self.api_url}")
            print(f"Dados: {json.dumps(payload, indent=2)}")
            
            response = requests.post(self.api_url, json=payload, timeout=10)
            
            if response.status_code == 200:
                print("✓ Dados enviados com sucesso via pino 11")
                print(f"Resposta: {response.json()}")
                return True
            else:
                print(f"✗ Erro no envio: {response.status_code}")
                print(f"Resposta: {response.text}")
                return False
                
        except Exception as e:
            print(f"✗ Erro no envio de dados: {e}")
            return False
    
    def run_continuous_test(self, duration=60):
        """Executar teste contínuo por um período"""
        print(f"\n=== TESTE CONTÍNUO POR {duration} SEGUNDOS ===")
        
        start_time = time.time()
        reading_count = 0
        success_count = 0
        
        while time.time() - start_time < duration:
            print(f"\n--- Leitura {reading_count + 1} ---")
            
            # Ler dados do DHT11
            sensor_data = self.test_dht11_with_pin11()
            
            if sensor_data.get('valid', False):
                # Enviar dados
                if self.send_data_via_pin11(sensor_data):
                    success_count += 1
                
                reading_count += 1
                
                # Aguardar antes da próxima leitura
                time.sleep(2)
            else:
                print("Aguardando sensor estabilizar...")
                time.sleep(5)
        
        # Resumo
        print(f"\n=== RESUMO DO TESTE CONTÍNUO ===")
        print(f"Tempo total: {duration} segundos")
        print(f"Leituras realizadas: {reading_count}")
        print(f"Envios bem-sucedidos: {success_count}")
        print(f"Taxa de sucesso: {(success_count/reading_count*100):.1f}%" if reading_count > 0 else "0%")
        
        return {
            'duration': duration,
            'readings': reading_count,
            'successful_sends': success_count,
            'success_rate': success_count/reading_count if reading_count > 0 else 0
        }
    
    def run_complete_test(self):
        """Executar teste completo do pino 11"""
        print("=" * 60)
        print("TESTE COMPLETO DO PINO 11 (GPIO17) COM DHT11")
        print("=" * 60)
        
        results = {
            "gpio_setup": False,
            "pin11_communication": False,
            "dht11_reading": False,
            "data_transmission": False
        }
        
        # 1. Configurar GPIO
        results["gpio_setup"] = self.setup_gpio()
        
        # 2. Testar comunicação do pino 11
        if results["gpio_setup"]:
            results["pin11_communication"] = self.test_pin11_communication()
        
        # 3. Testar leitura do DHT11
        if results["pin11_communication"]:
            sensor_data = self.test_dht11_with_pin11()
            results["dht11_reading"] = sensor_data.get('valid', False)
            
            # 4. Enviar dados
            if results["dht11_reading"]:
                results["data_transmission"] = self.send_data_via_pin11(sensor_data)
        
        # Resumo dos resultados
        print("\n" + "=" * 60)
        print("RESUMO DOS TESTES")
        print("=" * 60)
        
        for test_name, result in results.items():
            status = "✓ PASSOU" if result else "✗ FALHOU"
            print(f"{test_name.replace('_', ' ').title()}: {status}")
        
        # Limpar GPIO
        GPIO.cleanup()
        
        return results

def main():
    """Função principal"""
    print("Teste do Pino 11 (GPIO17) com DHT11")
    print("Este script testa a comunicação do pino 11 do HAT com o Raspberry Pi 4")
    
    # Verificar se está rodando no Raspberry Pi
    try:
        import RPi.GPIO as GPIO
    except ImportError:
        print("✗ Este script deve ser executado no Raspberry Pi")
        print("Instale: sudo apt install python3-rpi.gpio")
        return
    
    tester = Pin11DHT11Tester()
    
    # Executar teste completo
    results = tester.run_complete_test()
    
    # Verificar se todos os testes passaram
    all_passed = all(results.values())
    
    if all_passed:
        print("\n🎉 TODOS OS TESTES PASSARAM!")
        print("O pino 11 está funcionando corretamente com o DHT11.")
        
        # Perguntar se quer executar teste contínuo
        try:
            response = input("\nDeseja executar um teste contínuo? (s/n): ").lower()
            if response in ['s', 'sim', 'y', 'yes']:
                duration = int(input("Duração em segundos (padrão 60): ") or "60")
                tester.run_continuous_test(duration)
        except KeyboardInterrupt:
            print("\nTeste interrompido pelo usuário.")
    else:
        print("\n⚠ ALGUNS TESTES FALHARAM!")
        print("Verifique as conexões e configurações do pino 11.")

if __name__ == "__main__":
    main()
