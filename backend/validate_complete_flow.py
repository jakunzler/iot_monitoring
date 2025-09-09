#!/usr/bin/env python3
"""
Validação Completa do Fluxo de Dados
DHT11 → GPIO11 → Raspberry Pi 4 → RM520N-GL → Internet
"""

import RPi.GPIO as GPIO
import time
import json
import requests
import subprocess
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

class CompleteDataFlowValidator:
    def __init__(self):
        self.pin11_gpio = 17  # GPIO17 corresponde ao pino físico 11
        self.api_url = os.getenv("PUBLISH_URL", "http://localhost:8080/api/ingest")
        self.device_id = os.getenv("DEVICE_ID", "PiCarX-Complete-Flow")
        
    def validate_hardware_setup(self):
        """Validar configuração do hardware"""
        print("=" * 60)
        print("VALIDAÇÃO DO HARDWARE")
        print("=" * 60)
        
        results = {
            "raspberry_pi": False,
            "gpio_access": False,
            "dht11_library": False,
            "rm520n_detection": False,
            "network_interface": False
        }
        
        # 1. Verificar Raspberry Pi
        try:
            import RPi.GPIO as GPIO
            results["raspberry_pi"] = True
            print("✓ Raspberry Pi detectado")
        except ImportError:
            print("✗ Raspberry Pi não detectado")
            return results
        
        # 2. Verificar acesso GPIO
        try:
            GPIO.setmode(GPIO.BCM)
            GPIO.setup(self.pin11_gpio, GPIO.IN, pull_up_down=GPIO.PULL_UP)
            pin_state = GPIO.input(self.pin11_gpio)
            GPIO.cleanup()
            results["gpio_access"] = True
            print(f"✓ Acesso GPIO funcionando (Pino 11: {pin_state})")
        except Exception as e:
            print(f"✗ Erro no acesso GPIO: {e}")
        
        # 3. Verificar biblioteca DHT11
        if DHT_LIBRARY:
            results["dht11_library"] = True
            print(f"✓ Biblioteca DHT11 disponível: {DHT_LIBRARY}")
        else:
            print("✗ Biblioteca DHT11 não encontrada")
        
        # 4. Verificar módulo RM520N-GL
        try:
            result = subprocess.run(['lsusb'], capture_output=True, text=True)
            if 'quectel' in result.stdout.lower() or 'rm520n' in result.stdout.lower():
                results["rm520n_detection"] = True
                print("✓ Módulo RM520N-GL detectado")
            else:
                print("⚠ Módulo RM520N-GL não detectado via USB")
        except Exception as e:
            print(f"✗ Erro na detecção do módulo: {e}")
        
        # 5. Verificar interface de rede
        try:
            result = subprocess.run(['ip', 'link', 'show'], capture_output=True, text=True)
            if 'usb0' in result.stdout or 'wwan0' in result.stdout:
                results["network_interface"] = True
                print("✓ Interface de rede 5G detectada")
            else:
                print("⚠ Interface de rede 5G não encontrada")
        except Exception as e:
            print(f"✗ Erro na verificação de interface: {e}")
        
        return results
    
    def validate_dht11_reading(self):
        """Validar leitura do DHT11 no pino 11"""
        print("\n" + "=" * 60)
        print("VALIDAÇÃO DA LEITURA DHT11")
        print("=" * 60)
        
        if not DHT_LIBRARY:
            print("✗ Biblioteca DHT11 não disponível")
            return False
        
        GPIO.setwarnings(False)
        GPIO.setmode(GPIO.BCM)
        
        try:
            if DHT_LIBRARY == "Adafruit_DHT":
                sensor = Adafruit_DHT.DHT11
                humidity, temperature = Adafruit_DHT.read_retry(sensor, self.pin11_gpio)
                
                if humidity is not None and temperature is not None:
                    print(f"✓ Leitura DHT11 bem-sucedida:")
                    print(f"  Temperatura: {temperature:.1f}°C")
                    print(f"  Umidade: {humidity:.1f}%")
                    GPIO.cleanup()
                    return {
                        'temperature': temperature,
                        'humidity': humidity,
                        'valid': True
                    }
                else:
                    print("✗ Falha na leitura do DHT11")
                    GPIO.cleanup()
                    return False
                    
            elif DHT_LIBRARY == "dht11":
                sensor = dht11.DHT11(pin=self.pin11_gpio)
                result = sensor.read()
                
                if result.is_valid():
                    print(f"✓ Leitura DHT11 bem-sucedida:")
                    print(f"  Temperatura: {result.temperature:.1f}°C")
                    print(f"  Umidade: {result.humidity:.1f}%")
                    GPIO.cleanup()
                    return {
                        'temperature': result.temperature,
                        'humidity': result.humidity,
                        'valid': True
                    }
                else:
                    print(f"✗ Falha na leitura do DHT11: Error Code {result.error_code}")
                    GPIO.cleanup()
                    return False
                    
        except Exception as e:
            print(f"✗ Erro na leitura do DHT11: {e}")
            GPIO.cleanup()
            return False
    
    def validate_5g_connectivity(self):
        """Validar conectividade 5G"""
        print("\n" + "=" * 60)
        print("VALIDAÇÃO DA CONECTIVIDADE 5G")
        print("=" * 60)
        
        results = {
            "modem_status": False,
            "network_connectivity": False,
            "public_ip": False,
            "api_reachability": False
        }
        
        # 1. Verificar status do modem
        try:
            result = subprocess.run(['mmcli', '-m', '0', '--status'], 
                                 capture_output=True, text=True)
            if result.returncode == 0:
                results["modem_status"] = True
                print("✓ Modem RM520N-GL ativo")
            else:
                print("✗ Modem RM520N-GL não ativo")
        except Exception as e:
            print(f"✗ Erro ao verificar modem: {e}")
        
        # 2. Testar conectividade de rede
        try:
            result = subprocess.run(['ping', '-c', '3', '8.8.8.8'], 
                                 capture_output=True, text=True)
            if result.returncode == 0:
                results["network_connectivity"] = True
                print("✓ Conectividade de rede funcionando")
            else:
                print("✗ Sem conectividade de rede")
        except Exception as e:
            print(f"✗ Erro no teste de conectividade: {e}")
        
        # 3. Obter IP público
        try:
            response = requests.get('https://ifconfig.me', timeout=10)
            if response.status_code == 200:
                public_ip = response.text.strip()
                results["public_ip"] = True
                print(f"✓ IP público obtido: {public_ip}")
            else:
                print("✗ Não foi possível obter IP público")
        except Exception as e:
            print(f"✗ Erro ao obter IP público: {e}")
        
        # 4. Testar acesso à API
        try:
            response = requests.get(self.api_url.replace('/api/ingest', '/api/latest/test'), 
                                 timeout=5)
            if response.status_code in [200, 404]:  # 404 é OK se não há dados
                results["api_reachability"] = True
                print("✓ API acessível")
            else:
                print(f"✗ API não acessível: {response.status_code}")
        except Exception as e:
            print(f"✗ Erro ao acessar API: {e}")
        
        return results
    
    def validate_complete_data_flow(self, sensor_data):
        """Validar fluxo completo de dados"""
        print("\n" + "=" * 60)
        print("VALIDAÇÃO DO FLUXO COMPLETO DE DADOS")
        print("=" * 60)
        
        if not sensor_data.get('valid', False):
            print("✗ Dados do sensor inválidos")
            return False
        
        # Preparar payload completo
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
                "module_type": "RM520N-GL",
                "connection_type": "5G",
                "dht11_library": DHT_LIBRARY,
                "flow_validation": True,
                "validation_timestamp": datetime.now().isoformat()
            },
            "reading_number": 1
        }
        
        print("Dados preparados para envio:")
        print(json.dumps(payload, indent=2))
        
        # Enviar dados
        try:
            print(f"\nEnviando dados para: {self.api_url}")
            response = requests.post(self.api_url, json=payload, timeout=10)
            
            if response.status_code == 200:
                print("✓ Dados enviados com sucesso!")
                print(f"Resposta: {response.json()}")
                return True
            else:
                print(f"✗ Erro no envio: {response.status_code}")
                print(f"Resposta: {response.text}")
                return False
                
        except Exception as e:
            print(f"✗ Erro no envio de dados: {e}")
            return False
    
    def run_complete_validation(self):
        """Executar validação completa"""
        print("=" * 80)
        print("VALIDAÇÃO COMPLETA DO FLUXO DE DADOS")
        print("DHT11 → GPIO11 → Raspberry Pi 4 → RM520N-GL → Internet")
        print("=" * 80)
        
        # 1. Validar hardware
        hardware_results = self.validate_hardware_setup()
        
        # 2. Validar leitura DHT11
        sensor_data = self.validate_dht11_reading()
        
        # 3. Validar conectividade 5G
        connectivity_results = self.validate_5g_connectivity()
        
        # 4. Validar fluxo completo
        flow_success = False
        if sensor_data and connectivity_results.get("api_reachability", False):
            flow_success = self.validate_complete_data_flow(sensor_data)
        
        # Resumo final
        print("\n" + "=" * 80)
        print("RESUMO FINAL DA VALIDAÇÃO")
        print("=" * 80)
        
        print("\nHardware:")
        for component, status in hardware_results.items():
            status_text = "✓ OK" if status else "✗ FALHOU"
            print(f"  {component.replace('_', ' ').title()}: {status_text}")
        
        print(f"\nSensor DHT11:")
        if sensor_data:
            print(f"  Leitura: ✓ OK ({sensor_data['temperature']:.1f}°C, {sensor_data['humidity']:.1f}%)")
        else:
            print(f"  Leitura: ✗ FALHOU")
        
        print(f"\nConectividade 5G:")
        for component, status in connectivity_results.items():
            status_text = "✓ OK" if status else "✗ FALHOU"
            print(f"  {component.replace('_', ' ').title()}: {status_text}")
        
        print(f"\nFluxo Completo:")
        flow_status = "✓ SUCESSO" if flow_success else "✗ FALHOU"
        print(f"  Transmissão de Dados: {flow_status}")
        
        # Determinar status geral
        critical_components = [
            hardware_results["raspberry_pi"],
            hardware_results["gpio_access"],
            hardware_results["dht11_library"],
            connectivity_results["network_connectivity"],
            flow_success
        ]
        
        overall_success = all(critical_components)
        
        print(f"\n{'='*80}")
        if overall_success:
            print("🎉 VALIDAÇÃO COMPLETA BEM-SUCEDIDA!")
            print("O fluxo DHT11 → GPIO11 → Raspberry Pi 4 → RM520N-GL → Internet está funcionando!")
        else:
            print("⚠ VALIDAÇÃO INCOMPLETA!")
            print("Alguns componentes críticos falharam. Verifique as configurações.")
        print(f"{'='*80}")
        
        return {
            'hardware': hardware_results,
            'sensor_data': sensor_data,
            'connectivity': connectivity_results,
            'flow_success': flow_success,
            'overall_success': overall_success
        }

def main():
    """Função principal"""
    print("Validador Completo do Fluxo de Dados")
    print("DHT11 → GPIO11 → Raspberry Pi 4 → RM520N-GL → Internet")
    
    # Verificar se está rodando no Raspberry Pi
    try:
        import RPi.GPIO as GPIO
    except ImportError:
        print("✗ Este script deve ser executado no Raspberry Pi")
        print("Instale: sudo apt install python3-rpi.gpio")
        return
    
    validator = CompleteDataFlowValidator()
    results = validator.run_complete_validation()
    
    # Salvar resultados em arquivo
    try:
        with open('/tmp/validation_results.json', 'w') as f:
            json.dump(results, f, indent=2, default=str)
        print(f"\nResultados salvos em: /tmp/validation_results.json")
    except Exception as e:
        print(f"Erro ao salvar resultados: {e}")

if __name__ == "__main__":
    main()
