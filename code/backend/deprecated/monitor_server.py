#!/usr/bin/env python3
"""
Script de monitoramento para o servidor DHT22
Verifica status do serviço, conectividade e performance
"""

import os
import sys
import time
import requests
import sqlite3
import subprocess
from datetime import datetime, timedelta
from pathlib import Path

# Configurações
SERVER_IP = "200.137.220.50"
SERVER_PORT = 8080
SERVER_URL = f"http://{SERVER_IP}:{SERVER_PORT}"
SERVICE_NAME = "dht22-server"
DATABASE_FILE = "/opt/dht22-server/dht22_data.db"
LOG_FILE = "/var/log/dht22-server/monitor.log"

def log_message(message):
    """Registra mensagem no log"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_entry = f"[{timestamp}] {message}"
    print(log_entry)
    
    # Escrever no arquivo de log
    try:
        with open(LOG_FILE, "a") as f:
            f.write(log_entry + "\n")
    except Exception:
        pass

def check_service_status():
    """Verifica status do serviço systemd"""
    try:
        result = subprocess.run(
            f"systemctl is-active {SERVICE_NAME}",
            shell=True,
            capture_output=True,
            text=True
        )
        status = result.stdout.strip()
        return status == "active"
    except Exception as e:
        log_message(f"Erro ao verificar status do serviço: {e}")
        return False

def check_server_connectivity():
    """Verifica conectividade do servidor"""
    try:
        response = requests.get(f"{SERVER_URL}/api/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            return True, data
        else:
            return False, f"Status code: {response.status_code}"
    except Exception as e:
        return False, str(e)

def check_database():
    """Verifica status do banco de dados"""
    try:
        if not os.path.exists(DATABASE_FILE):
            return False, "Arquivo de banco não encontrado"
        
        conn = sqlite3.connect(DATABASE_FILE)
        cursor = conn.cursor()
        
        # Verificar se tabela existe
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='sensor_data'")
        if not cursor.fetchone():
            return False, "Tabela sensor_data não encontrada"
        
        # Contar registros
        cursor.execute("SELECT COUNT(*) FROM sensor_data")
        count = cursor.fetchone()[0]
        
        # Verificar último registro
        cursor.execute("SELECT MAX(timestamp) FROM sensor_data")
        last_timestamp = cursor.fetchone()[0]
        
        conn.close()
        
        return True, {
            'total_records': count,
            'last_timestamp': last_timestamp,
            'last_update': datetime.fromtimestamp(last_timestamp) if last_timestamp else None
        }
    except Exception as e:
        return False, str(e)

def check_disk_space():
    """Verifica espaço em disco"""
    try:
        result = subprocess.run(
            "df -h /opt",
            shell=True,
            capture_output=True,
            text=True
        )
        lines = result.stdout.strip().split('\n')
        if len(lines) > 1:
            parts = lines[1].split()
            if len(parts) >= 5:
                usage = parts[4].replace('%', '')
                return int(usage)
        return 0
    except Exception:
        return 0

def check_memory_usage():
    """Verifica uso de memória"""
    try:
        result = subprocess.run(
            "free -m | grep Mem",
            shell=True,
            capture_output=True,
            text=True
        )
        parts = result.stdout.split()
        if len(parts) >= 3:
            total = int(parts[1])
            used = int(parts[2])
            return (used / total) * 100
        return 0
    except Exception:
        return 0

def check_log_errors():
    """Verifica erros nos logs"""
    try:
        error_log = "/var/log/dht22-server/error.log"
        if not os.path.exists(error_log):
            return 0
        
        # Contar erros das últimas 24 horas
        since_time = datetime.now() - timedelta(hours=24)
        error_count = 0
        
        with open(error_log, 'r') as f:
            for line in f:
                if 'ERROR' in line or 'CRITICAL' in line:
                    # Extrair timestamp da linha (formato pode variar)
                    try:
                        # Assumindo formato: YYYY-MM-DD HH:MM:SS
                        timestamp_str = line[:19]
                        log_time = datetime.strptime(timestamp_str, "%Y-%m-%d %H:%M:%S")
                        if log_time >= since_time:
                            error_count += 1
                    except Exception:
                        # Se não conseguir parsear timestamp, contar como erro recente
                        error_count += 1
        
        return error_count
    except Exception:
        return 0

def send_alert(message):
    """Envia alerta (implementar conforme necessário)"""
    log_message(f"ALERTA: {message}")
    # Aqui você pode implementar envio de email, Slack, etc.

def main():
    """Função principal de monitoramento"""
    log_message("=== INICIANDO MONITORAMENTO ===")
    
    # Verificar status do serviço
    service_active = check_service_status()
    if not service_active:
        send_alert(f"Serviço {SERVICE_NAME} não está ativo!")
        return False
    
    # Verificar conectividade
    connectivity_ok, connectivity_data = check_server_connectivity()
    if not connectivity_ok:
        send_alert(f"Servidor não está respondendo: {connectivity_data}")
        return False
    
    # Verificar banco de dados
    db_ok, db_data = check_database()
    if not db_ok:
        send_alert(f"Problema no banco de dados: {db_data}")
        return False
    
    # Verificar espaço em disco
    disk_usage = check_disk_space()
    if disk_usage > 90:
        send_alert(f"Espaço em disco crítico: {disk_usage}%")
    
    # Verificar uso de memória
    memory_usage = check_memory_usage()
    if memory_usage > 90:
        send_alert(f"Uso de memória crítico: {memory_usage:.1f}%")
    
    # Verificar erros nos logs
    error_count = check_log_errors()
    if error_count > 10:
        send_alert(f"Muitos erros nos logs: {error_count} erros nas últimas 24h")
    
    # Resumo do status
    log_message("=== STATUS DO SERVIDOR ===")
    log_message(f"Serviço: {'✅ Ativo' if service_active else '❌ Inativo'}")
    log_message(f"Conectividade: {'✅ OK' if connectivity_ok else '❌ Falha'}")
    log_message(f"Banco de dados: {'✅ OK' if db_ok else '❌ Falha'}")
    log_message(f"Espaço em disco: {disk_usage}%")
    log_message(f"Uso de memória: {memory_usage:.1f}%")
    log_message(f"Erros nas últimas 24h: {error_count}")
    
    if isinstance(db_data, dict):
        log_message(f"Total de registros: {db_data['total_records']}")
        if db_data['last_update']:
            log_message(f"Última atualização: {db_data['last_update']}")
    
    log_message("=== MONITORAMENTO CONCLUÍDO ===")
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
