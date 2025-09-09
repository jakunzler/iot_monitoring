#!/usr/bin/env python3
"""
Configurador do Módulo Quectel RM520N-GL para Raspberry Pi 4
Configuração específica para o módulo 5G RM520N-GL com DHT22 no pino 11
"""

import subprocess
import time
import json
import requests
import os
from datetime import datetime

class RM520NConfigurator:
    def __init__(self):
        self.module_name = "RM520N-GL"
        self.apn_configs = {
            "claro": "claro.com.br",
            "vivo": "zap.vivo.com.br",
            "tim": "timbrasil.br",
            "oi": "gprs.oi.com.br"
        }
        self.current_apn = None
        
    def check_system_requirements(self):
        """Verificar requisitos do sistema"""
        print("=== VERIFICAÇÃO DE REQUISITOS DO SISTEMA ===")
        
        requirements = {
            "modemmanager": False,
            "network_manager": False,
            "usb_connection": False,
            "python_requests": False,
            "gpio_access": False
        }
        
        # Verificar ModemManager
        try:
            result = subprocess.run(['which', 'mmcli'], capture_output=True, text=True)
            if result.returncode == 0:
                requirements["modemmanager"] = True
                print("✓ ModemManager (mmcli) instalado")
            else:
                print("✗ ModemManager não encontrado")
        except:
            print("✗ Erro ao verificar ModemManager")
        
        # Verificar NetworkManager
        try:
            result = subprocess.run(['which', 'nmcli'], capture_output=True, text=True)
            if result.returncode == 0:
                requirements["network_manager"] = True
                print("✓ NetworkManager (nmcli) instalado")
            else:
                print("✗ NetworkManager não encontrado")
        except:
            print("✗ Erro ao verificar NetworkManager")
        
        # Verificar conexão USB
        try:
            result = subprocess.run(['lsusb'], capture_output=True, text=True)
            if 'quectel' in result.stdout.lower() or 'rm520n' in result.stdout.lower():
                requirements["usb_connection"] = True
                print("✓ Módulo RM520N-GL detectado via USB")
            else:
                print("⚠ Módulo RM520N-GL não detectado via USB")
        except:
            print("✗ Erro ao verificar conexão USB")
        
        # Verificar Python requests
        try:
            import requests
            requirements["python_requests"] = True
            print("✓ Biblioteca Python requests disponível")
        except ImportError:
            print("✗ Biblioteca Python requests não encontrada")
        
        # Verificar acesso GPIO
        try:
            import RPi.GPIO as GPIO
            requirements["gpio_access"] = True
            print("✓ Acesso GPIO disponível")
        except ImportError:
            print("✗ Acesso GPIO não disponível")
        
        return requirements
    
    def install_requirements(self):
        """Instalar requisitos necessários"""
        print("\n=== INSTALAÇÃO DE REQUISITOS ===")
        
        commands = [
            "sudo apt update",
            "sudo apt install -y modemmanager network-manager python3-requests python3-rpi.gpio",
            "sudo systemctl enable --now ModemManager",
            "sudo systemctl enable --now NetworkManager"
        ]
        
        for cmd in commands:
            print(f"Executando: {cmd}")
            try:
                result = subprocess.run(cmd.split(), capture_output=True, text=True)
                if result.returncode == 0:
                    print(f"✓ {cmd} executado com sucesso")
                else:
                    print(f"✗ Erro em {cmd}: {result.stderr}")
            except Exception as e:
                print(f"✗ Erro ao executar {cmd}: {e}")
    
    def detect_modem(self):
        """Detectar modem RM520N-GL"""
        print("\n=== DETECÇÃO DO MODEM ===")
        
        try:
            # Listar modems disponíveis
            result = subprocess.run(['mmcli', '-L'], capture_output=True, text=True)
            
            if result.returncode == 0:
                print("Modems detectados:")
                print(result.stdout)
                
                # Verificar se há modems
                if '/org/freedesktop/ModemManager1/Modem/' in result.stdout:
                    print("✓ Modem detectado")
                    return True
                else:
                    print("✗ Nenhum modem detectado")
                    return False
            else:
                print(f"✗ Erro ao listar modems: {result.stderr}")
                return False
                
        except Exception as e:
            print(f"✗ Erro na detecção do modem: {e}")
            return False
    
    def configure_apn(self, apn_name="vivo"):
        """Configurar APN"""
        print(f"\n=== CONFIGURAÇÃO APN: {apn_name.upper()} ===")
        
        if apn_name not in self.apn_configs:
            print(f"✗ APN '{apn_name}' não suportado")
            print(f"APNs disponíveis: {list(self.apn_configs.keys())}")
            return False
        
        apn_value = self.apn_configs[apn_name]
        self.current_apn = apn_value
        
        try:
            # Configurar APN usando ModemManager
            cmd = ['sudo', 'mmcli', '-m', '0', '--simple-connect', f'apn={apn_value}']
            print(f"Executando: {' '.join(cmd)}")
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0:
                print(f"✓ APN '{apn_value}' configurado com sucesso")
                return True
            else:
                print(f"✗ Erro ao configurar APN: {result.stderr}")
                return False
                
        except Exception as e:
            print(f"✗ Erro na configuração do APN: {e}")
            return False
    
    def check_network_interface(self):
        """Verificar interface de rede"""
        print("\n=== VERIFICAÇÃO DA INTERFACE DE REDE ===")
        
        try:
            # Listar interfaces de rede
            result = subprocess.run(['ip', 'link', 'show'], capture_output=True, text=True)
            
            print("Interfaces de rede disponíveis:")
            print(result.stdout)
            
            # Verificar interfaces específicas do módulo
            interfaces = ['usb0', 'wwan0', 'eth1']
            found_interfaces = []
            
            for interface in interfaces:
                if interface in result.stdout:
                    found_interfaces.append(interface)
                    print(f"✓ Interface {interface} encontrada")
            
            if found_interfaces:
                return found_interfaces[0]  # Retornar primeira interface encontrada
            else:
                print("⚠ Nenhuma interface específica do módulo encontrada")
                return None
                
        except Exception as e:
            print(f"✗ Erro ao verificar interfaces: {e}")
            return None
    
    def test_connectivity(self):
        """Testar conectividade"""
        print("\n=== TESTE DE CONECTIVIDADE ===")
        
        try:
            # Teste de ping
            print("Testando conectividade com 8.8.8.8...")
            result = subprocess.run(['ping', '-c', '3', '8.8.8.8'], 
                                 capture_output=True, text=True)
            
            if result.returncode == 0:
                print("✓ Conectividade funcionando")
                
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
                print("✗ Sem conectividade")
                print(result.stderr)
                return False
                
        except Exception as e:
            print(f"✗ Erro no teste de conectividade: {e}")
            return False
    
    def send_test_data(self, api_url="http://localhost:8080/api/ingest"):
        """Enviar dados de teste via 5G"""
        print(f"\n=== ENVIO DE DADOS VIA 5G ===")
        
        test_data = {
            "device_id": "PiCarX-RM520N-5G-Test",
            "timestamp": int(time.time()),
            "sensor": "DHT22",
            "data": {
                "temperature": 25.5,
                "humidity": 60.2,
                "temperature_f": 77.9
            },
            "metadata": {
                "gpio_pin": 11,
                "gpio_bcm": 17,
                "module_type": "RM520N-GL",
                "connection_type": "5G",
                "apn": self.current_apn,
                "test_mode": True,
                "config_timestamp": datetime.now().isoformat()
            },
            "reading_number": 1
        }
        
        try:
            print(f"Enviando dados para: {api_url}")
            print(f"Dados: {json.dumps(test_data, indent=2)}")
            
            response = requests.post(api_url, json=test_data, timeout=10)
            
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
    
    def configure_persistent_connection(self, apn_name="vivo"):
        """Configurar conexão persistente via NetworkManager"""
        print(f"\n=== CONFIGURAÇÃO PERSISTENTE ===")
        
        if apn_name not in self.apn_configs:
            print(f"✗ APN '{apn_name}' não suportado")
            return False
        
        apn_value = self.apn_configs[apn_name]
        
        try:
            # Criar conexão GSM persistente
            cmd = [
                'sudo', 'nmcli', 'con', 'add', 'type', 'gsm',
                'ifname', '*', 'con-name', 'rm520n-5g',
                'apn', apn_value
            ]
            
            print(f"Executando: {' '.join(cmd)}")
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0:
                print("✓ Conexão persistente criada")
                
                # Ativar conexão
                activate_cmd = ['sudo', 'nmcli', 'con', 'up', 'rm520n-5g']
                print(f"Executando: {' '.join(activate_cmd)}")
                
                activate_result = subprocess.run(activate_cmd, capture_output=True, text=True)
                
                if activate_result.returncode == 0:
                    print("✓ Conexão ativada")
                    return True
                else:
                    print(f"✗ Erro ao ativar conexão: {activate_result.stderr}")
                    return False
            else:
                print(f"✗ Erro ao criar conexão: {result.stderr}")
                return False
                
        except Exception as e:
            print(f"✗ Erro na configuração persistente: {e}")
            return False
    
    def run_complete_setup(self):
        """Executar configuração completa"""
        print("=" * 80)
        print("CONFIGURAÇÃO COMPLETA DO MÓDULO RM520N-GL")
        print("Para Raspberry Pi 4 com DHT22 no pino 11")
        print("=" * 80)
        
        results = {
            "requirements": False,
            "modem_detection": False,
            "apn_config": False,
            "network_interface": False,
            "connectivity": False,
            "data_transmission": False,
            "persistent_config": False
        }
        
        # 1. Verificar requisitos
        requirements = self.check_system_requirements()
        if not all(requirements.values()):
            print("\nInstalando requisitos faltantes...")
            self.install_requirements()
            requirements = self.check_system_requirements()
        
        results["requirements"] = all(requirements.values())
        
        # 2. Detectar modem
        results["modem_detection"] = self.detect_modem()
        
        # 3. Configurar APN (usar Vivo como padrão)
        if results["modem_detection"]:
            results["apn_config"] = self.configure_apn("vivo")
        
        # 4. Verificar interface de rede
        results["network_interface"] = self.check_network_interface() is not None
        
        # 5. Testar conectividade
        results["connectivity"] = self.test_connectivity() is not False
        
        # 6. Enviar dados de teste
        if results["connectivity"]:
            results["data_transmission"] = self.send_test_data()
        
        # 7. Configurar conexão persistente
        results["persistent_config"] = self.configure_persistent_connection("vivo")
        
        # Resumo
        print("\n" + "=" * 80)
        print("RESUMO DA CONFIGURAÇÃO")
        print("=" * 80)
        
        for test_name, result in results.items():
            status = "✓ CONCLUÍDO" if result else "✗ FALHOU"
            print(f"{test_name.replace('_', ' ').title()}: {status}")
        
        return results

def main():
    """Função principal"""
    print("Configurador do Módulo Quectel RM520N-GL")
    print("Este script configura o módulo 5G RM520N-GL no Raspberry Pi 4")
    print("Para uso com DHT22 no pino 11 (GPIO17)")
    
    configurator = RM520NConfigurator()
    results = configurator.run_complete_setup()
    
    # Verificar se a configuração foi bem-sucedida
    critical_tests = ["requirements", "modem_detection", "apn_config", "connectivity"]
    critical_passed = all(results[test] for test in critical_tests)
    
    if critical_passed:
        print("\n🎉 CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!")
        print("O módulo RM520N-GL está configurado e funcionando.")
        print("Agora você pode usar o DHT22 no pino 11 para enviar dados via 5G.")
    else:
        print("\n⚠ CONFIGURAÇÃO INCOMPLETA!")
        print("Alguns componentes críticos falharam. Verifique as conexões e configurações.")

if __name__ == "__main__":
    main()
