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

echo "=== NAVEGANDO PARA O BACKEND NO REPOSITORIO ==="
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND="$REPO_ROOT/code/backend"
if [ ! -f "$BACKEND/deprecated/setup_server_production.py" ] && [ -n "${DHT22_BACKEND_ROOT:-}" ]; then
  BACKEND="$DHT22_BACKEND_ROOT"
fi
if [ ! -f "$BACKEND/deprecated/setup_server_production.py" ]; then
  echo "Nao encontrei deprecated/setup_server_production.py em:"
  echo "  $REPO_ROOT/code/backend  (padrao)"
  echo "Defina DHT22_BACKEND_ROOT para o diretorio code/backend do clone."
  exit 1
fi
cd "$BACKEND"
pwd
ls -la
echo ""

echo "=== EXECUTANDO SCRIPT DE CONFIGURAÇÃO (deprecated/setup_server_production.py) ==="
python3 deprecated/setup_server_production.py
