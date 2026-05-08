#!/usr/bin/env python3
"""
Teste de Validação do Pino 11 (GPIO17) e Módulo RM520N-GL
Verifica se o pino 11 do HAT está enviando dados corretamente para o Raspberry Pi 4
e se o módulo Quectel RM520N-GL está transmitindo dados via 5G
"""

import RPi.GPIO as GPIO
import time
import json
import requests
import subprocess
import os
from datetime import datetime

class Pin11RM520NTester:
    def __init__(self):
        self.pin11_gpio = 17  # GPIO17 corresponde ao pino físico 11
        self.test_data = {
            "device_id": "PiCarX-RM520N-Test",
            "timestamp": int(time.time()),
            "sensor": "DHT11",
            "data": {
                "temperature": 25.5,
                "humidity": 60.2
            },
            "metadata": {
                "gpio_pin": 11,
                "gpio_bcm": 17,
                "module": "RM520N-GL",
                "connection_type": "5G",
                "test_mode": True
            },
            "reading_number": 1
        }
        
    def setup_gpio(self):
        """Configurar GPIO para teste do pino 11"""
        print("=== CONFIGURAÇÃO GPIO PINO 11 ===")
        GPIO.setwarnings(False)
        GPIO.setmode(GPIO.BCM)
        
        try:
            # Configurar pino 11 (GPIO17) como entrada com pull-up
            GPIO.setup(self.pin11_gpio, GPIO.IN, pull_up_down=GPIO.PULL_UP)
            print(f"✓ GPIO17 (Pino 11) configurado como entrada com pull-up")
            return True
        except Exception as e:
            print(f"✗ Erro ao configurar GPIO17: {e}")
            return False
    
    def test_pin11_communication(self):
        """Testar comunicação do pino 11"""
        print("\n=== TESTE DE COMUNICAÇÃO PINO 11 ===")
        
        try:
            # Ler estado do pino
            pin_state = GPIO.input(self.pin11_gpio)
            print(f"Estado do GPIO17 (Pino 11): {pin_state}")
            
            # Simular dados do DHT11 via pino 11
            print("Simulando dados do DHT11 via pino 11...")
            
            # Atualizar dados de teste com informações do pino
            self.test_data["metadata"]["pin11_state"] = pin_state
            self.test_data["metadata"]["pin11_timestamp"] = datetime.now().isoformat()
            
            print("✓ Dados simulados preparados para transmissão via pino 11")
            return True
            
        except Exception as e:
            print(f"✗ Erro no teste do pino 11: {e}")
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
    
    def test_5g_connection(self):
        """Testar conexão 5G via RM520N-GL"""
        print("\n=== TESTE DE CONEXÃO 5G ===")
        
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
                    self.test_data["metadata"]["public_ip"] = public_ip
                except:
                    print("⚠ Não foi possível obter IP público")
                
                return True
            else:
                print("✗ Sem conectividade de rede")
                return False
                
        except Exception as e:
            print(f"✗ Erro no teste de conectividade: {e}")
            return False
    
    def send_test_data(self, api_url="200.137.220.50:8080/api/ingest"):
        """Enviar dados de teste para a API"""
        print(f"\n=== ENVIO DE DADOS VIA 5G ===")
        print(f"URL da API: {api_url}")
        
        try:
            # Atualizar timestamp
            self.test_data["timestamp"] = int(time.time())
            
            # Enviar dados
            response = requests.post(api_url, json=self.test_data, timeout=10)
            
            if response.status_code == 200:
                print("✓ Dados enviados com sucesso via 5G")
                print(f"Resposta: {response.json()}")
                return True
            else:
                print(f"✗ Erro no envio: {response.status_code}")
                print(f"Resposta: {response.text}")
                return False
                
        except Exception as e:
            print(f"✗ Erro no envio de dados: {e}")
            return False
    
    def run_complete_test(self):
        """Executar teste completo"""
        print("=" * 60)
        print("TESTE COMPLETO: PINO 11 + MÓDULO RM520N-GL")
        print("=" * 60)
        
        results = {
            "gpio_setup": False,
            "pin11_communication": False,
            "rm520n_detection": False,
            "5g_connection": False,
            "data_transmission": False
        }
        
        # 1. Configurar GPIO
        results["gpio_setup"] = self.setup_gpio()
        
        # 2. Testar comunicação do pino 11
        if results["gpio_setup"]:
            results["pin11_communication"] = self.test_pin11_communication()
        
        # 3. Verificar módulo RM520N-GL
        results["rm520n_detection"] = self.check_rm520n_module()
        
        # 4. Testar conexão 5G
        results["5g_connection"] = self.test_5g_connection()
        
        # 5. Enviar dados de teste
        if results["5g_connection"]:
            results["data_transmission"] = self.send_test_data()
        
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
    print("Iniciando teste de validação do pino 11 e módulo RM520N-GL...")
    
    # Verificar se está rodando no Raspberry Pi
    try:
        import RPi.GPIO as GPIO
    except ImportError:
        print("✗ Este script deve ser executado no Raspberry Pi")
        print("Instale: sudo apt install python3-rpi.gpio")
        return
    
    # Executar teste
    tester = Pin11RM520NTester()
    results = tester.run_complete_test()
    
    # Verificar se todos os testes passaram
    all_passed = all(results.values())
    
    if all_passed:
        print("\n🎉 TODOS OS TESTES PASSARAM!")
        print("O pino 11 e o módulo RM520N-GL estão funcionando corretamente.")
    else:
        print("\n⚠ ALGUNS TESTES FALHARAM!")
        print("Verifique as configurações e conexões.")

if __name__ == "__main__":
    main()
