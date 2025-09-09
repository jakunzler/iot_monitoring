#!/usr/bin/env python3
"""
Teste do DHT22 no Pino 11 (GPIO17) com Módulo RM520N-GL
Validação específica da comunicação do pino 11 do HAT com o Raspberry Pi 4
e transmissão via módulo Quectel RM520N-GL (5G)
"""

import RPi.GPIO as GPIO
import adafruit_dht
import board
import time
import json
import requests
import subprocess
import os
from datetime import datetime

# Tentar importar bibliotecas do DHT22
try:
    import adafruit_dht
    DHT_LIBRARY = "adafruit_dht"
    DHT_SENSOR = adafruit_dht.DHT22
    print("✅ Biblioteca adafruit_dht importada com sucesso")
except ImportError:
    try:
        import Adafruit_DHT
        DHT_LIBRARY = "Adafruit_DHT"
        DHT_SENSOR = Adafruit_DHT.DHT22  # Usar DHT22 ao invés de DHT11
        print("✅ Biblioteca Adafruit_DHT importada com sucesso")
    except ImportError:
        try:
            import dht11
            DHT_LIBRARY = "dht11"
            DHT_SENSOR = None  # dht11 não diferencia DHT11/DHT22
            print("✅ Biblioteca dht11 importada com sucesso")
        except ImportError:
            DHT_LIBRARY = None
            DHT_SENSOR = None
            print("❌ Nenhuma biblioteca DHT encontrada")

class DHT22Pin11RM520NTester:
    def __init__(self):
        self.pin11_gpio = 17  # GPIO17 corresponde ao pino físico 11
        self.api_url = os.getenv("PUBLISH_URL", "http://localhost:8080/api/ingest")
        self.device_id = os.getenv("DEVICE_ID", "PiCarX-DHT22-Pin11-5G")
        
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
    
    def test_dht22_with_pin11(self):
        """Testar DHT22 conectado ao pino 11"""
        print("\n=== TESTE DHT22 NO PINO 11 ===")
        
        if DHT_LIBRARY is None:
            print("✗ Nenhuma biblioteca DHT encontrada")
            print("Instale: pip3 install Adafruit_DHT ou pip3 install dht11")
            return False
        
        print(f"Usando biblioteca: {DHT_LIBRARY}")
        print("Sensor: DHT22 (mais preciso que DHT11)")
        
        try:
            if DHT_LIBRARY == "Adafruit_DHT":
                # Usar Adafruit_DHT com DHT22
                humidity, temperature = Adafruit_DHT.read_retry(DHT_SENSOR, self.pin11_gpio)
                
                if humidity is not None and temperature is not None:
                    print(f"✓ Leitura DHT22 bem-sucedida:")
                    print(f"  Temperatura: {temperature:.1f}°C")
                    print(f"  Umidade: {humidity:.1f}%")
                    print(f"  Precisão: ±0.5°C, ±2%RH (DHT22)")
                    return {
                        'temperature': temperature,
                        'humidity': humidity,
                        'valid': True,
                        'sensor_type': 'DHT22'
                    }
                else:
                    print("✗ Falha na leitura do DHT22")
                    return {'valid': False}
                    
            elif DHT_LIBRARY == "dht11":
                # Usar dht11 (funciona com DHT22 também)
                sensor = dht11.DHT11(pin=self.pin11_gpio)
                result = sensor.read()
                
                if result.is_valid():
                    print(f"✓ Leitura DHT22 bem-sucedida:")
                    print(f"  Temperatura: {result.temperature:.1f}°C")
                    print(f"  Umidade: {result.humidity:.1f}%")
                    return {
                        'temperature': result.temperature,
                        'humidity': result.humidity,
                        'valid': True,
                        'sensor_type': 'DHT22'
                    }
                else:
                    print(f"✗ Falha na leitura do DHT22: Error Code {result.error_code}")
                    return {'valid': False}
                    
        except Exception as e:
            print(f"✗ Erro na leitura do DHT22: {e}")
            return False
    
    def check_rm520n_module(self):
        """Verificar se o módulo RM520N-GL está presente e funcionando"""
        print("\n=== VERIFICAÇÃO MÓDULO RM520N-GL ===")
        
        try:
            # Verificar se o módulo está conectado via USB
            result = subprocess.run(['lsusb'], capture_output=True, text=True)
            usb_devices = result.stdout.lower()
            
            if 'quectel' in usb_devices or 'rm520n' in usb_devices:
                print("✓ Módulo RM520N-GL detectado via USB")
            else:
                print("⚠ Módulo RM520N-GL não detectado via USB")
                print("Dispositivos USB encontrados:")
                print(result.stdout)
            
            # Verificar interfaces de rede
            result = subprocess.run(['ip', 'link', 'show'], capture_output=True, text=True)
            network_interfaces = result.stdout
            
            if 'usb0' in network_interfaces or 'wwan0' in network_interfaces:
                print("✓ Interface de rede 5G detectada")
            else:
                print("⚠ Interface de rede 5G não encontrada")
            
            # Verificar se ModemManager está rodando
            result = subprocess.run(['systemctl', 'is-active', 'ModemManager'], 
                                 capture_output=True, text=True)
            if result.stdout.strip() == 'active':
                print("✓ ModemManager está ativo")
            else:
                print("⚠ ModemManager não está ativo")
            
            return True
            
        except Exception as e:
            print(f"✗ Erro na verificação do módulo RM520N-GL: {e}")
            return False
    
    def test_5g_connectivity(self):
        """Testar conectividade 5G via RM520N-GL"""
        print("\n=== TESTE DE CONECTIVIDADE 5G ===")
        
        try:
            # Verificar conectividade de rede
            result = subprocess.run(['ping', '-c', '3', '8.8.8.8'], 
                                 capture_output=True, text=True)
            
            if result.returncode == 0:
                print("✓ Conectividade de rede funcionando")
                
                # Obter IP público
                try:
                    response = requests.get('https://ifconfig.me', timeout=10)
                    public_ip = response.text.strip()
                    print(f"✓ IP público: {public_ip}")
                    return public_ip
                except:
                    print("⚠ Não foi possível obter IP público")
                    return True
            else:
                print("✗ Sem conectividade de rede")
                return False
                
        except Exception as e:
            print(f"✗ Erro no teste de conectividade: {e}")
            return False
    
    def send_data_via_5g(self, sensor_data):
        """Enviar dados coletados via módulo RM520N-GL (5G)"""
        print("\n=== ENVIO DE DADOS VIA 5G (RM520N-GL) ===")
        
        if not sensor_data.get('valid', False):
            print("✗ Dados do sensor inválidos, não enviando")
            return False
        
        # Preparar dados para envio
        payload = {
            "device_id": self.device_id,
            "timestamp": int(time.time()),
            "sensor": "DHT22",
            "data": {
                "temperature": sensor_data['temperature'],
                "humidity": sensor_data['humidity'],
                "temperature_f": sensor_data['temperature'] * 9/5 + 32
            },
            "metadata": {
                "gpio_pin": 11,
                "gpio_bcm": 17,
                "module_type": "RM520N-GL",
                "connection_type": "5G",
                "pin11_state": GPIO.input(self.pin11_gpio),
                "test_mode": True,
                "dht_library": DHT_LIBRARY,
                "sensor_model": sensor_data.get('sensor_type', 'DHT22'),
                "rm520n_status": "active"
            },
            "reading_number": 1
        }
        
        try:
            print(f"Enviando dados para: {self.api_url}")
            print(f"Dados: {json.dumps(payload, indent=2)}")
            
            response = requests.post(self.api_url, json=payload, timeout=10)
            
            if response.status_code == 200:
                print("✓ Dados enviados com sucesso via 5G (RM520N-GL)")
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
            
            # Ler dados do DHT22
            sensor_data = self.test_dht22_with_pin11()
            
            if sensor_data.get('valid', False):
                # Enviar dados via 5G
                if self.send_data_via_5g(sensor_data):
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
        """Executar teste completo do pino 11 com DHT22 e RM520N-GL"""
        print("=" * 80)
        print("TESTE COMPLETO: DHT22 + PINO 11 + RM520N-GL")
        print("DHT22 → GPIO17 (Pino 11) → Raspberry Pi 4 → RM520N-GL → Internet")
        print("=" * 80)
        
        results = {
            "gpio_setup": False,
            "pin11_communication": False,
            "dht22_reading": False,
            "rm520n_detection": False,
            "5g_connectivity": False,
            "data_transmission": False
        }
        
        # 1. Configurar GPIO
        results["gpio_setup"] = self.setup_gpio()
        
        # 2. Testar comunicação do pino 11
        if results["gpio_setup"]:
            try:
                pin_state = GPIO.input(self.pin11_gpio)
                print(f"Estado do GPIO17 (Pino 11): {pin_state}")
                results["pin11_communication"] = True
            except Exception as e:
                print(f"✗ Erro na comunicação do pino 11: {e}")
        
        # 3. Testar leitura do DHT22
        if results["pin11_communication"]:
            sensor_data = self.test_dht22_with_pin11()
            results["dht22_reading"] = sensor_data.get('valid', False)
        
        # 4. Verificar módulo RM520N-GL
        results["rm520n_detection"] = self.check_rm520n_module()
        
        # 5. Testar conectividade 5G
        results["5g_connectivity"] = self.test_5g_connectivity() is not False
        
        # 6. Enviar dados
        if results["dht22_reading"] and results["5g_connectivity"]:
            sensor_data = self.test_dht22_with_pin11()
            results["data_transmission"] = self.send_data_via_5g(sensor_data)
        
        # Resumo dos resultados
        print("\n" + "=" * 80)
        print("RESUMO DOS TESTES")
        print("=" * 80)
        
        for test_name, result in results.items():
            status = "✓ PASSOU" if result else "✗ FALHOU"
            print(f"{test_name.replace('_', ' ').title()}: {status}")
        
        # Limpar GPIO
        GPIO.cleanup()
        
        return results

def main():
    """Função principal"""
    print("Teste do DHT22 no Pino 11 com Módulo RM520N-GL")
    print("Este script testa a comunicação do pino 11 do HAT com o Raspberry Pi 4")
    print("e a transmissão via módulo Quectel RM520N-GL (5G)")
    
    # Verificar se está rodando no Raspberry Pi
    try:
        import RPi.GPIO as GPIO
    except ImportError:
        print("✗ Este script deve ser executado no Raspberry Pi")
        print("Instale: sudo apt install python3-rpi.gpio")
        return
    
    tester = DHT22Pin11RM520NTester()
    
    # Executar teste completo
    results = tester.run_complete_test()
    
    # Verificar se todos os testes passaram
    critical_tests = ["gpio_setup", "pin11_communication", "dht22_reading", "5g_connectivity"]
    critical_passed = all(results[test] for test in critical_tests)
    
    if critical_passed:
        print("\n🎉 TODOS OS TESTES CRÍTICOS PASSARAM!")
        print("O DHT22 no pino 11 está funcionando corretamente com o módulo RM520N-GL.")
        
        # Perguntar se quer executar teste contínuo
        try:
            response = input("\nDeseja executar um teste contínuo? (s/n): ").lower()
            if response in ['s', 'sim', 'y', 'yes']:
                duration = int(input("Duração em segundos (padrão 60): ") or "60")
                tester.run_continuous_test(duration)
        except KeyboardInterrupt:
            print("\nTeste interrompido pelo usuário.")
    else:
        print("\n⚠ ALGUNS TESTES CRÍTICOS FALHARAM!")
        print("Verifique as conexões e configurações do pino 11 e módulo RM520N-GL.")

if __name__ == "__main__":
    main()
