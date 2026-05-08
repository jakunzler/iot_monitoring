#!/usr/bin/env python3
"""
Script para atualizar configuração do módulo 5G para enviar dados
para o servidor com IP fixo
"""

import os
import sys
from pathlib import Path

# Configurações
SERVER_IP = "200.137.220.50"
SERVER_PORT = 8080
PUBLISH_URL = f"http://{SERVER_IP}:{SERVER_PORT}/api/ingest"

def update_publisher_config():
    """Atualiza configuração do publisher"""
    print("\n=== Atualizando configuração do publisher ===")
    
    publisher_file = Path(__file__).parent / "publish_picarx_dht22.py"
    
    if not publisher_file.exists():
        print(f"❌ Arquivo não encontrado: {publisher_file}")
        return False
    
    # Ler arquivo atual
    with open(publisher_file, 'r') as f:
        content = f.read()
    
    # Substituir URL padrão
    old_url = 'PUBLISH_URL   = os.getenv("PUBLISH_URL", "http://127.0.0.1:8080/api/ingest")'
    new_url = f'PUBLISH_URL   = os.getenv("PUBLISH_URL", "{PUBLISH_URL}")'
    
    if old_url in content:
        content = content.replace(old_url, new_url)
        print(f"✅ URL atualizada para: {PUBLISH_URL}")
    else:
        print("⚠️ URL padrão não encontrada no arquivo")
    
    # Salvar arquivo atualizado
    with open(publisher_file, 'w') as f:
        f.write(content)
    
    print(f"✅ Arquivo atualizado: {publisher_file}")
    return True

def create_env_file():
    """Cria arquivo .env com configurações"""
    print("\n=== Criando arquivo .env ===")
    
    env_file = Path(__file__).parent / ".env"
    
    env_content = f"""# Configurações do módulo 5G DHT22
PUBLISH_URL={PUBLISH_URL}
DEVICE_ID=PiCarX-RM520N-DHT22
READ_INTERVAL_S=2.5
REQUEST_TIMEOUT_S=10
DHT_GPIO_BCM=17

# Configurações do servidor
SERVER_IP={SERVER_IP}
SERVER_PORT={SERVER_PORT}
"""
    
    with open(env_file, 'w') as f:
        f.write(env_content)
    
    print(f"✅ Arquivo .env criado: {env_file}")
    return True

def create_test_script():
    """Cria script de teste para verificar conectividade"""
    print("\n=== Criando script de teste ===")
    
    test_script = Path(__file__).parent / "test_server_connection.py"
    
    test_content = f'''#!/usr/bin/env python3
"""
Script de teste para verificar conectividade com o servidor
"""

import requests
import json
import time

SERVER_URL = "{PUBLISH_URL}"
TEST_DEVICE_ID = "test-device"

def test_server_connection():
    """Testa conexão com o servidor"""
    print(f"Testando conexão com: {{SERVER_URL}}")
    
    # Teste 1: Verificar se servidor está rodando
    try:
        response = requests.get(f"{{SERVER_URL.replace('/api/ingest', '')}}/", timeout=10)
        print(f"✅ Servidor respondendo (status: {{response.status_code}})")
    except Exception as e:
        print(f"❌ Servidor não acessível: {{e}}")
        return False
    
    # Teste 2: Enviar dados de teste
    test_data = {{
        "device_id": TEST_DEVICE_ID,
        "timestamp": int(time.time()),
        "sensor": "dht22",
        "reading_number": 1,
        "data": {{
            "temperature": 25.5,
            "humidity": 60.0,
            "temperature_f": 77.9
        }},
        "metadata": {{
            "wifi_rssi": None,
            "wifi_ip": "test-ip",
            "uptime_seconds": 100
        }}
    }}
    
    try:
        response = requests.post(SERVER_URL, json=test_data, timeout=10)
        if response.status_code == 200:
            print(f"✅ Dados enviados com sucesso (status: {{response.status_code}})")
            print(f"Resposta: {{response.json()}}")
        else:
            print(f"❌ Erro ao enviar dados (status: {{response.status_code}})")
            print(f"Resposta: {{response.text}}")
            return False
    except Exception as e:
        print(f"❌ Erro ao enviar dados: {{e}}")
        return False
    
    # Teste 3: Verificar se dados foram recebidos
    try:
        latest_url = f"{{SERVER_URL.replace('/api/ingest', '')}}/api/latest/{{TEST_DEVICE_ID}}"
        response = requests.get(latest_url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Dados recebidos com sucesso:")
            print(f"  Temperatura: {{data['data']['temperature']}}°C")
            print(f"  Umidade: {{data['data']['humidity']}}%")
        else:
            print(f"⚠️ Dados não encontrados (status: {{response.status_code}})")
    except Exception as e:
        print(f"❌ Erro ao verificar dados: {{e}}")
        return False
    
    return True

if __name__ == "__main__":
    print("=== TESTE DE CONECTIVIDADE ===")
    if test_server_connection():
        print("\\n✅ Todos os testes passaram!")
    else:
        print("\\n❌ Alguns testes falharam!")
'''
    
    with open(test_script, 'w') as f:
        f.write(test_content)
    
    # Tornar executável
    os.chmod(test_script, 0o755)
    
    print(f"✅ Script de teste criado: {test_script}")
    return True

def create_deployment_script():
    """Cria script para deploy no PiCarX"""
    print("\n=== Criando script de deploy ===")
    
    deploy_script = Path(__file__).parent / "deploy_to_picarx.sh"
    
    deploy_content = f'''#!/bin/bash
"""
Script para fazer deploy da configuração atualizada no PiCarX
"""

echo "=== DEPLOY PARA PICARX ==="
echo "Servidor: {SERVER_IP}:{SERVER_PORT}"
echo "================================"

# Verificar se estamos no PiCarX
if ! grep -q "PiCarX" /proc/cpuinfo 2>/dev/null; then
    echo "⚠️  Este script deve ser executado no PiCarX"
    read -p "Continuar mesmo assim? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Parar serviço atual se estiver rodando
echo "Parando serviço atual..."
sudo systemctl stop dht22-publisher 2>/dev/null || true

# Fazer backup da configuração atual
echo "Fazendo backup..."
cp publish_picarx_dht22.py publish_picarx_dht22.py.backup 2>/dev/null || true
cp .env .env.backup 2>/dev/null || true

# Atualizar arquivos
echo "Atualizando arquivos..."
# Os arquivos já devem estar atualizados pelo script Python

# Instalar dependências se necessário
echo "Verificando dependências..."
python3 -c "import requests, adafruit_dht" 2>/dev/null || {{
    echo "Instalando dependências..."
    pip3 install requests adafruit-circuitpython-dht
}}

# Testar conectividade
echo "Testando conectividade..."
python3 test_server_connection.py

if [ $? -eq 0 ]; then
    echo "✅ Teste de conectividade passou!"
    
    # Reiniciar serviço
    echo "Reiniciando serviço..."
    sudo systemctl start dht22-publisher
    sudo systemctl enable dht22-publisher
    
    echo "✅ Deploy concluído com sucesso!"
    echo "Servidor: http://{SERVER_IP}:{SERVER_PORT}"
else
    echo "❌ Teste de conectividade falhou!"
    echo "Revertendo alterações..."
    cp publish_picarx_dht22.py.backup publish_picarx_dht22.py 2>/dev/null || true
    cp .env.backup .env 2>/dev/null || true
    exit 1
fi
'''
    
    with open(deploy_script, 'w') as f:
        f.write(deploy_content)
    
    # Tornar executável
    os.chmod(deploy_script, 0o755)
    
    print(f"✅ Script de deploy criado: {deploy_script}")
    return True

def main():
    """Função principal"""
    print("=== CONFIGURAÇÃO DO MÓDULO 5G ===")
    print(f"Servidor de destino: {SERVER_IP}:{SERVER_PORT}")
    print(f"URL de publicação: {PUBLISH_URL}")
    print("=" * 40)
    
    # Atualizar configuração do publisher
    if not update_publisher_config():
        print("❌ Falha na atualização da configuração")
        sys.exit(1)
    
    # Criar arquivo .env
    if not create_env_file():
        print("❌ Falha na criação do arquivo .env")
        sys.exit(1)
    
    # Criar script de teste
    if not create_test_script():
        print("❌ Falha na criação do script de teste")
        sys.exit(1)
    
    # Criar script de deploy
    if not create_deployment_script():
        print("❌ Falha na criação do script de deploy")
        sys.exit(1)
    
    print("\n" + "=" * 40)
    print("✅ CONFIGURAÇÃO CONCLUÍDA!")
    print("\nPróximos passos:")
    print("1. Execute o script de configuração do servidor na máquina 200.137.220.50:")
    print("   cd code/backend && python3 deprecated/setup_server_production.py")
    print("\n2. Teste a conectividade:")
    print("   python3 test_server_connection.py")
    print("\n3. Faça deploy no PiCarX:")
    print("   ./deploy_to_picarx.sh")
    print("=" * 40)

if __name__ == "__main__":
    main()
