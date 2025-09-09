#!/bin/bash
# Script para configurar o servidor DHT22 na máquina remota

echo "=== VERIFICANDO PORTAS OCUPADAS ==="
ss -tulpn | grep LISTEN
echo ""

echo "=== VERIFICANDO PORTA 8080 ==="
ss -tulpn | grep :8080
echo ""

echo "=== VERIFICANDO FIREWALL ==="
sudo ufw status
echo ""

echo "=== VERIFICANDO PYTHON3 ==="
python3 --version
echo ""

echo "=== VERIFICANDO PIP3 ==="
pip3 --version
echo ""

echo "=== NAVEGANDO PARA O DIRETÓRIO BACKEND ==="
cd ~/backend
pwd
ls -la
echo ""

echo "=== EXECUTANDO SCRIPT DE CONFIGURAÇÃO ==="
python3 setup_server_production.py
