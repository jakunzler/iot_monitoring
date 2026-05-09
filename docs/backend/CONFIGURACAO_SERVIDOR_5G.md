# Configuração do Servidor DHT22 para Módulo 5G

Este documento descreve como configurar o servidor para receber dados do módulo 5G RM520N-GL na máquina com IP fixo `200.137.220.50`.

## Problema

O módulo 5G recebe um IP da operadora e não consegue enviar dados para `localhost` ou IPs privados. É necessário configurar o servidor em uma máquina com IP fixo para que o módulo possa enviar os dados.

## Solução

Configurar o servidor Flask na máquina com IP fixo `200.137.220.50` e atualizar a configuração do módulo 5G para enviar dados para este servidor.

## Arquivos relevantes (estrutura atual do repositório)

### Backend (`code/backend/`)

- **`server.py`** – API de desenvolvimento
- **`server_production.py`** – API usada em `/opt/dht22-server/` (Gunicorn/systemd)
- **`gunicorn.conf.py`**, **`requirements.txt`**, **`Dockerfile`**

### Backend legado / utilitários (`code/backend/deprecated/`)

- **`setup_server_production.py`** – Provisionamento na máquina com IP fixo
- **`monitor_server.py`** – Monitoramento opcional (não entra na imagem Cloud Run atual)
- **`server_cloudrun.py`** – Entrada usada por `code/Dockerfile.cloudrun`

### Publisher na Pi (`code/publisher/` + `systemd/`)

- **`publish_picarx_dht22.py`**, **`install-systemd.sh`** – Serviço em `/home/pi/publisher`

### Ferramentas RM520 / testes (`code/publisher/deprecated/`)

- **`setup_module_5g.py`**, **`configure_rm520n.py`**, testes `test_*.py`, **`run_tests.sh`**

## Passo a Passo

### 1. Configuração do Servidor (Máquina 200.137.220.50)

```bash
# Na máquina com IP fixo 200.137.220.50 (dentro do clone Git)
cd /caminho/para/iot_monitoring/code/backend
python3 deprecated/setup_server_production.py
```

Este script irá:
- Instalar dependências Python
- Criar usuário `dht22` para o serviço
- Configurar diretórios `/opt/dht22-server` e `/var/log/dht22-server`
- Copiar arquivos do servidor
- Configurar firewall (porta 8080)
- Criar serviço systemd
- Iniciar o serviço

### 2. Atualização da Configuração do Módulo 5G

```bash
# No clone do repositório (não necessariamente na Pi)
cd /caminho/para/iot_monitoring/code/publisher/deprecated
python3 setup_module_5g.py
```

Este script (legado) pode referenciar arquivos antigos; o fluxo atual na Pi usa `code/publisher/publish_picarx_dht22.py` + `systemd` + `/etc/default/picarx-dht22-publisher`. Historicamente fazia também:
- Ajustes de `PUBLISH_URL` no publisher
- Criar arquivo `.env` com configurações
- Criar script de teste de conectividade
- Criar script de deploy para o PiCarX

### 3. Teste de Conectividade

```bash
curl -s http://200.137.220.50:8080/api/health
```

(Se existir script `test_server_connection.py` na sua máquina, pode usá-lo como wrapper a este `curl`.)

### 4. Deploy no PiCarX

```bash
# Ver scripts/update-picarx-fixed.sh e code/publisher/install-systemd.sh
# no repositório; `./deploy_to_picarx.sh` era referência legada.
```

## Configurações Importantes

### Servidor (200.137.220.50)

- **IP**: 200.137.220.50
- **Porta**: 8080
- **Usuário**: dht22
- **Diretório**: /opt/dht22-server
- **Logs**: /var/log/dht22-server/
- **Banco**: /opt/dht22-server/dht22_data.db

### Módulo 5G

- **PUBLISH_URL**: http://200.137.220.50:8080/api/ingest
- **DEVICE_ID**: PiCarX-RM520N-DHT22
- **INTERVAL**: 2.5 segundos
- **TIMEOUT**: 10 segundos

## Comandos Úteis

### Gerenciamento do Serviço

```bash
# Verificar status
sudo systemctl status dht22-server

# Reiniciar serviço
sudo systemctl restart dht22-server

# Ver logs
sudo journalctl -u dht22-server -f

# Parar serviço
sudo systemctl stop dht22-server
```

### Monitoramento

```bash
# Monitoramento opcional (script legacy no backend)
cd /caminho/para/iot_monitoring/code/backend
python3 deprecated/monitor_server.py

# Verificar conectividade
curl http://200.137.220.50:8080/api/health

# Ver dados mais recentes
curl http://200.137.220.50:8080/api/latest/PiCarX-RM520N-DHT22
```

### Firewall

```bash
# Verificar status do firewall
sudo ufw status

# Liberar porta específica
sudo ufw allow 8080/tcp

# Bloquear porta
sudo ufw deny 8080/tcp
```

## Endpoints da API

### Receber Dados
- **URL**: `POST http://200.137.220.50:8080/api/ingest`
- **Descrição**: Recebe dados do sensor DHT22

### Dados Mais Recentes
- **URL**: `GET http://200.137.220.50:8080/api/latest/<device_id>`
- **Descrição**: Retorna a leitura mais recente de um dispositivo

### Histórico
- **URL**: `GET http://200.137.220.50:8080/api/history/<device_id>?limit=50`
- **Descrição**: Retorna histórico de leituras

### Estatísticas
- **URL**: `GET http://200.137.220.50:8080/api/stats/<device_id>`
- **Descrição**: Retorna estatísticas do dispositivo

### Health Check
- **URL**: `GET http://200.137.220.50:8080/api/health`
- **Descrição**: Verifica status do servidor

## Formato dos Dados

### Envio (Módulo 5G → Servidor)

```json
{
  "device_id": "PiCarX-RM520N-DHT22",
  "timestamp": 1703123456,
  "sensor": "dht22",
  "reading_number": 1,
  "data": {
    "temperature": 25.5,
    "humidity": 60.0,
    "temperature_f": 77.9
  },
  "metadata": {
    "wifi_rssi": null,
    "wifi_ip": "192.168.1.100",
    "uptime_seconds": 100
  }
}
```

### Resposta (Servidor → Módulo 5G)

```json
{
  "status": "success",
  "message": "Dados recebidos com sucesso",
  "timestamp": "2023-12-21T10:30:45.123456"
}
```

## Troubleshooting

### Servidor não responde

1. Verificar se o serviço está ativo:
   ```bash
   sudo systemctl status dht22-server
   ```

2. Verificar logs:
   ```bash
   sudo journalctl -u dht22-server -f
   ```

3. Verificar firewall:
   ```bash
   sudo ufw status
   ```

### Módulo 5G não consegue enviar dados

1. Testar conectividade:
   ```bash
   python3 test_server_connection.py
   ```

2. Verificar configuração:
   ```bash
   cat .env
   ```

3. Verificar se o servidor está acessível:
   ```bash
   curl http://200.137.220.50:8080/api/health
   ```

### Problemas de Performance

1. Executar monitoramento (legacy):
   ```bash
   cd /caminho/para/iot_monitoring/code/backend && python3 deprecated/monitor_server.py
   ```

2. Verificar uso de recursos:
   ```bash
   htop
   df -h
   ```

## Segurança

### Firewall
- Apenas a porta 8080 está liberada
- SSH deve estar configurado adequadamente

### Usuário do Serviço
- Serviço roda com usuário `dht22` (sem privilégios)
- Arquivos com permissões adequadas

### Logs
- Logs de acesso e erro separados
- Rotação automática de logs

## Backup

### Banco de Dados
```bash
# Backup do banco
cp /opt/dht22-server/dht22_data.db /backup/dht22_data_$(date +%Y%m%d).db
```

### Configurações
```bash
# Backup das configurações
tar -czf /backup/dht22-server-config_$(date +%Y%m%d).tar.gz /opt/dht22-server/
```

## Atualizações

Para atualizar o servidor:

1. Parar o serviço:
   ```bash
   sudo systemctl stop dht22-server
   ```

2. Fazer backup:
   ```bash
   cp /opt/dht22-server/dht22_data.db /backup/
   ```

3. Atualizar arquivos:
   ```bash
   cd /caminho/para/iot_monitoring/code/backend
   sudo cp server_production.py /opt/dht22-server/
   ```

4. Reiniciar serviço:
   ```bash
   sudo systemctl start dht22-server
   ```

## Suporte

Para problemas ou dúvidas:
1. Verificar logs do sistema
2. Executar script de monitoramento
3. Testar conectividade
4. Verificar configurações de firewall
