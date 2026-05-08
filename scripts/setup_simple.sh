#!/bin/bash
# Script simplificado para configurar o servidor DHT22

echo "=== CONFIGURAÇÃO SIMPLIFICADA DO SERVIDOR DHT22 ==="
echo "IP: 200.137.220.50"
echo "Porta: 8080"
echo "================================================"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND="$REPO_ROOT/code/backend"
if [ ! -f "$BACKEND/server_production.py" ] && [ -n "${DHT22_BACKEND_ROOT:-}" ]; then
  BACKEND="$DHT22_BACKEND_ROOT"
fi
cd "$BACKEND" || exit 1
echo "Backend (repos): $(pwd)"

# Instalar dependências via apt (mais compatível com Ubuntu 24.04)
echo ""
echo "=== INSTALANDO DEPENDÊNCIAS VIA APT ==="
sudo apt update
sudo apt install -y python3-flask python3-flask-cors python3-requests python3-gunicorn

# Criar diretórios
echo ""
echo "=== CRIANDO DIRETÓRIOS ==="
sudo mkdir -p /opt/dht22-server
sudo mkdir -p /var/log/dht22-server
sudo chown cerise:cerise /opt/dht22-server
sudo chown cerise:cerise /var/log/dht22-server

# Copiar arquivos
echo ""
echo "=== COPIANDO ARQUIVOS ==="
cp server_production.py /opt/dht22-server/server.py
cp requirements.txt /opt/dht22-server/

# Configurar firewall
echo ""
echo "=== CONFIGURANDO FIREWALL ==="
sudo ufw allow 8080/tcp
sudo ufw --force enable

# Criar serviço systemd simples
echo ""
echo "=== CRIANDO SERVIÇO SYSTEMD ==="
sudo tee /etc/systemd/system/dht22-server.service > /dev/null <<EOF
[Unit]
Description=DHT22 Data Server
After=network.target

[Service]
Type=simple
User=cerise
Group=cerise
WorkingDirectory=/opt/dht22-server
ExecStart=/usr/bin/python3 /opt/dht22-server/server.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=dht22-server

# Variáveis de ambiente
Environment=FLASK_ENV=production
Environment=FLASK_RUN_HOST=0.0.0.0
Environment=FLASK_RUN_PORT=8080

[Install]
WantedBy=multi-user.target
EOF

# Configurar e iniciar serviço
echo ""
echo "=== CONFIGURANDO SERVIÇO ==="
sudo systemctl daemon-reload
sudo systemctl enable dht22-server
sudo systemctl start dht22-server

# Verificar status
echo ""
echo "=== VERIFICANDO STATUS ==="
sleep 3
sudo systemctl status dht22-server --no-pager

# Testar conectividade
echo ""
echo "=== TESTANDO CONECTIVIDADE ==="
sleep 2
curl -s http://localhost:8080/api/health || echo "Servidor ainda não está respondendo"

echo ""
echo "=== CONFIGURAÇÃO CONCLUÍDA ==="
echo "Servidor: http://200.137.220.50:8080"
echo "API: http://200.137.220.50:8080/api/ingest"
echo ""
echo "Comandos úteis:"
echo "  sudo systemctl status dht22-server"
echo "  sudo systemctl restart dht22-server"
echo "  sudo journalctl -u dht22-server -f"
