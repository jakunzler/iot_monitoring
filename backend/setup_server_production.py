#!/usr/bin/env python3
"""
Script de configuração do servidor de produção para máquina com IP fixo
Configuração para receber dados do módulo 5G RM520N-GL
"""

import time
import sys
import subprocess
import platform
from pathlib import Path

# Configurações do servidor
SERVER_IP = "200.137.220.50"
SERVER_PORT = 8080
SERVICE_NAME = "dht22-server"
USER_NAME = "dht22"

def run_command(cmd, check=True):
    """Executa comando e retorna resultado"""
    print(f"Executando: {cmd}")
    try:
        result = subprocess.run(cmd, shell=True, check=check, capture_output=True, text=True)
        if result.stdout:
            print(result.stdout)
        return result
    except subprocess.CalledProcessError as e:
        print(f"Erro: {e}")
        if e.stderr:
            print(f"Stderr: {e.stderr}")
        return e

def check_system():
    """Verifica sistema operacional"""
    system = platform.system().lower()
    print(f"Sistema operacional: {system}")
    
    if system not in ['linux']:
        print("❌ Este script é apenas para Linux")
        sys.exit(1)
    
    return system

def install_dependencies():
    """Instala dependências Python"""
    print("\n=== Instalando dependências Python ===")
    
    # Atualizar pip
    run_command("python3 -m pip install --upgrade pip")
    
    # Instalar dependências
    requirements_file = Path(__file__).parent / "requirements.txt"
    if requirements_file.exists():
        run_command(f"python3 -m pip install -r {requirements_file}")
    else:
        print("❌ Arquivo requirements.txt não encontrado")
        return False
    
    return True

def create_user():
    """Cria usuário para o serviço"""
    print("\n=== Criando usuário do serviço ===")
    
    # Verificar se usuário já existe
    result = run_command(f"id {USER_NAME}", check=False)
    if result.returncode == 0:
        print(f"✅ Usuário {USER_NAME} já existe")
        return True
    
    # Criar usuário
    run_command(f"sudo useradd -r -s /bin/false {USER_NAME}")
    print(f"✅ Usuário {USER_NAME} criado")
    return True

def setup_directories():
    """Configura diretórios do serviço"""
    print("\n=== Configurando diretórios ===")
    
    # Diretório do serviço
    service_dir = Path(f"/opt/{SERVICE_NAME}")
    run_command(f"sudo mkdir -p {service_dir}")
    run_command(f"sudo chown {USER_NAME}:{USER_NAME} {service_dir}")
    
    # Diretório de logs
    log_dir = Path(f"/var/log/{SERVICE_NAME}")
    run_command(f"sudo mkdir -p {log_dir}")
    run_command(f"sudo chown {USER_NAME}:{USER_NAME} {log_dir}")
    
    print(f"✅ Diretórios criados: {service_dir}, {log_dir}")
    return True

def copy_files():
    """Copia arquivos do serviço"""
    print("\n=== Copiando arquivos do serviço ===")
    
    current_dir = Path(__file__).parent
    service_dir = Path(f"/opt/{SERVICE_NAME}")
    
    # Arquivos necessários
    files_to_copy = [
        "server.py",
        "requirements.txt"
    ]
    
    for file_name in files_to_copy:
        src_file = current_dir / file_name
        if src_file.exists():
            run_command(f"sudo cp {src_file} {service_dir}/")
            run_command(f"sudo chown {USER_NAME}:{USER_NAME} {service_dir}/{file_name}")
            print(f"✅ Copiado: {file_name}")
        else:
            print(f"⚠️ Arquivo não encontrado: {file_name}")
    
    return True

def configure_firewall():
    """Configura firewall"""
    print("\n=== Configurando firewall ===")
    
    # Verificar se ufw está disponível
    result = run_command("which ufw", check=False)
    if result.returncode != 0:
        print("⚠️ UFW não encontrado, instalando...")
        run_command("sudo apt update && sudo apt install -y ufw")
    
    # Habilitar firewall
    run_command("sudo ufw --force enable")
    
    # Permitir SSH
    run_command("sudo ufw allow ssh")
    
    # Permitir porta do servidor
    run_command(f"sudo ufw allow {SERVER_PORT}/tcp")
    
    # Verificar status
    run_command("sudo ufw status")
    
    print(f"✅ Firewall configurado - porta {SERVER_PORT} liberada")
    return True

def create_systemd_service():
    """Cria serviço systemd"""
    print("\n=== Criando serviço systemd ===")
    
    service_file = f"/etc/systemd/system/{SERVICE_NAME}.service"
    
    service_content = f"""[Unit]
Description=DHT22 Data Server
After=network.target

[Service]
Type=simple
User={USER_NAME}
Group={USER_NAME}
WorkingDirectory=/opt/{SERVICE_NAME}
ExecStart=/usr/bin/python3 /opt/{SERVICE_NAME}/server.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier={SERVICE_NAME}

# Variáveis de ambiente
Environment=FLASK_ENV=production
Environment=FLASK_RUN_HOST=0.0.0.0
Environment=FLASK_RUN_PORT={SERVER_PORT}

[Install]
WantedBy=multi-user.target
"""
    
    # Escrever arquivo de serviço
    with open(f"/tmp/{SERVICE_NAME}.service", "w") as f:
        f.write(service_content)
    
    run_command(f"sudo mv /tmp/{SERVICE_NAME}.service {service_file}")
    run_command(f"sudo chmod 644 {service_file}")
    
    # Recarregar systemd
    run_command("sudo systemctl daemon-reload")
    
    # Habilitar serviço
    run_command(f"sudo systemctl enable {SERVICE_NAME}")
    
    print(f"✅ Serviço systemd criado: {service_file}")
    return True

def start_service():
    """Inicia o serviço"""
    print("\n=== Iniciando serviço ===")
    
    # Iniciar serviço
    run_command(f"sudo systemctl start {SERVICE_NAME}")
    
    # Verificar status
    time.sleep(2)
    run_command(f"sudo systemctl status {SERVICE_NAME}")
    
    print(f"✅ Serviço iniciado")
    return True

def test_server():
    """Testa o servidor"""
    print("\n=== Testando servidor ===")
    
    import requests
    import time
    
    url = f"http://{SERVER_IP}:{SERVER_PORT}/api/latest/test"
    
    print(f"Testando URL: {url}")
    
    try:
        response = requests.get(url, timeout=10)
        print(f"Status: {response.status_code}")
        if response.status_code == 404:
            print("✅ Servidor respondendo (404 é esperado para dispositivo inexistente)")
        else:
            print(f"Resposta: {response.text}")
    except Exception as e:
        print(f"❌ Erro no teste: {e}")
        return False
    
    return True

def main():
    """Função principal"""
    print("=== CONFIGURAÇÃO DO SERVIDOR DHT22 ===")
    print(f"IP do servidor: {SERVER_IP}")
    print(f"Porta: {SERVER_PORT}")
    print("=" * 40)
    
    # Verificar sistema
    check_system()
    
    # Instalar dependências
    if not install_dependencies():
        print("❌ Falha na instalação de dependências")
        sys.exit(1)
    
    # Criar usuário
    if not create_user():
        print("❌ Falha na criação do usuário")
        sys.exit(1)
    
    # Configurar diretórios
    if not setup_directories():
        print("❌ Falha na configuração de diretórios")
        sys.exit(1)
    
    # Copiar arquivos
    if not copy_files():
        print("❌ Falha na cópia de arquivos")
        sys.exit(1)
    
    # Configurar firewall
    if not configure_firewall():
        print("❌ Falha na configuração do firewall")
        sys.exit(1)
    
    # Criar serviço systemd
    if not create_systemd_service():
        print("❌ Falha na criação do serviço")
        sys.exit(1)
    
    # Iniciar serviço
    if not start_service():
        print("❌ Falha ao iniciar serviço")
        sys.exit(1)
    
    # Testar servidor
    if not test_server():
        print("❌ Falha no teste do servidor")
        sys.exit(1)
    
    print("\n" + "=" * 40)
    print("✅ CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!")
    print(f"Servidor rodando em: http://{SERVER_IP}:{SERVER_PORT}")
    print(f"API endpoint: http://{SERVER_IP}:{SERVER_PORT}/api/ingest")
    print("\nComandos úteis:")
    print(f"  sudo systemctl status {SERVICE_NAME}")
    print(f"  sudo systemctl restart {SERVICE_NAME}")
    print(f"  sudo journalctl -u {SERVICE_NAME} -f")
    print("=" * 40)

if __name__ == "__main__":
    main()
