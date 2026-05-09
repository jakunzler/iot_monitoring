# Sistema de Monitoramento IoT

Sistema de monitoramento de temperatura e umidade com frontend React, API Flask no backend e **publisher** (ESP32/PiCarX: leituras e envio HTTP), mais scripts operacionais e documentação.

## Estrutura do repositório

- `code/`: implementação técnica agrupada em três componentes.
- `scripts/`: automação de deploy e diagnóstico (máquina de desenvolvimento ou CI).
- `docs/`: documentação técnica e guias.

### Componentes em `code/`

```text
code/
├── frontend/
│   ├── src/ ...
│   └── deprecated/      # Páginas/componentes antigos (ex.: Project, DataDebugger)
├── backend/
│   ├── server.py, server_production.py, requirements.txt, Dockerfile ...
│   └── deprecated/      # Variantes legadas Cloud Run/setup/monitoramento
├── publisher/
│   ├── publish_picarx_dht22.py, systemd/, install-systemd.sh, requirements.txt
│   └── deprecated/      # Scripts RM520/GPIO/testes/publicadores alternativos
├── docker-compose.yml
├── Dockerfile.cloudrun
├── app.yaml
└── cloudrun*.yaml
```

Arquivos em cada `deprecated/` são mantidos como referência ou ferramentas pontuais; o fluxo principal usa apenas os arquivos na raiz do componente.

## Arquitetura

```text
ESP32 (Wi-Fi e/ou LoRa) / PiCarX (5G Quectel RM520N-GL, Wi-Fi como fallback) + DHT22
  -> rede -> API Flask -> SQLite -> painel React
```

No PiCarX o envio **prioriza o 5G** (módulo **Quectel RM520N-GL**); o **Wi-Fi** serve como alternativa quando fizer sentido na instalação. No ESP32 prevê-se **Wi-Fi** e **LoRa**, conforme firmware e hardware.

## Desenvolvimento local

### Frontend

```bash
cd code/frontend
npm install
npm run dev
```

### Backend

```bash
cd code/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python server.py
```

### Publisher (Raspberry Pi / PiCarX)

Código do publicador, testes de hardware e unidade systemd estão em `code/publisher/`.

**Instalação recomendada na Pi** (diretório fixo `/home/pi/publisher`): existem dois units em `code/publisher/systemd/` — **local** (`127.0.0.1`) e **remoto** (servidor na LAN ou na Internet). Só um deve estar ativo (o sensor DHT22 não suporta dois processos em paralelo).

| Perfil | Serviço systemd | Arquivo em `/etc/default/` |
|--------|-----------------|------------------------------|
| Local | `picarx-dht22-local-publisher` | `picarx-dht22-publisher` |
| Remoto | `picarx-dht22-remote-publisher` | `picarx-dht22-remote-publisher` |

Se o serviço **remoto** imprimir `Endpoint: http://127.0.0.1:8080/...`, o arquivo **`/etc/default/picarx-dht22-remote-publisher`** não existe ou não foi carregado; o Python usa então o valor padrão local. Crie-o a partir do exemplo no repositório e reinicie:

```bash
sudo cp /home/pi/publisher/systemd/picarx-dht22-remote-publisher.env /etc/default/picarx-dht22-remote-publisher
sudo nano /etc/default/picarx-dht22-remote-publisher   # ajuste PUBLISH_URL
sudo systemctl restart picarx-dht22-remote-publisher
```

1. Copie o conteúdo de `code/publisher/` para `/home/pi/publisher` (por exemplo com `scp -r` ou `rsync`).

```bash
scp -r code/publisher/ pi@picarx.local:/home/pi/
```

2. No Raspberry Pi OS recente, **pip install --user** no Python do sistema falha (PEP 668). Use o venv que **`install-systemd.sh`** cria em `/home/pi/publisher/.venv`. Pacote necessário:

```bash
ssh pi@picarx.local "sudo apt install -y python3-venv python3-full"
```

3. Registre o serviço (cria/atualiza `.venv`, instala `requirements.txt`, copia o env de exemplo só se `/etc/default/...` ainda não existir, e desativa o outro publicador):

**Local** (API em execução na própria Pi ou em outro host, mas com URL local no env):

```bash
ssh pi@picarx.local "cd /home/pi/publisher && chmod +x install-systemd.sh && PROFILE=local ./install-systemd.sh"
```

**Remoto:**

```bash
ssh pi@picarx.local "cd /home/pi/publisher && chmod +x install-systemd.sh && PROFILE=remote ./install-systemd.sh"
```

Edite `PUBLISH_URL` em `/etc/default/picarx-dht22-publisher` (local) ou `/etc/default/picarx-dht22-remote-publisher` (remoto) se o instalador tiver criado o arquivo com o placeholder do repositório.

Logs: `journalctl -u picarx-dht22-local-publisher -f` ou `journalctl -u picarx-dht22-remote-publisher -f`.

Da máquina de desenvolvimento, o script `scripts/update-picarx-fixed.sh` também envia os arquivos e registra o systemd na Pi.

**Teste manual (sem systemd):**

```bash
cd /home/pi/publisher
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
export PUBLISH_URL=https://seu-servidor:8080/api/ingest
.venv/bin/python publish_picarx_dht22.py
```

**Hardware / RM520 (menu de testes legado):** `cd code/publisher/deprecated && ./run_tests.sh`

## Docker (frontend + backend)

```bash
cd code
docker compose up --build
```

## Deploy

### Google Cloud App Engine (frontend estático)

O `app.yaml` referencia `frontend/dist`. Build e deploy a partir de `code/`:

```bash
cd code/frontend && npm install && npm run build && cd ..
gcloud app deploy app.yaml
```

Ou use `scripts/deploy-gcp.sh` a partir da raiz do repositório.

### Outros scripts

Exemplos em `scripts/`:

- `scripts/deploy-cloudrun.sh`
- `scripts/deploy-complete.sh`
- `scripts/diagnose_server.sh`

## API principal

- `GET /api/latest/{device_id}`: leitura mais recente.
- `GET /api/history/{device_id}`: histórico de leituras.
- `GET /api/stats/{device_id}`: estatísticas agregadas.

## Documentação adicional

Em `docs/` e em `docs/backend/` (inclui material sobre módulo 5G / RM520N).

### Diagramas UML (PlantUML)

Origem dos diagramas por idioma: `docs/uml/pt/`, `docs/uml/en/`, `docs/uml/es/` (mesmos ficheiros `.puml` traduzidos: contexto, containers, componentes do backend, papéis no repositório, implantação, sequência).

Para gerar SVG e PDF com Docker:

```bash
./scripts/docs/export-uml-pdf.sh
```

Saída: `docs/dist/svg/{pt,en,es}/`, `docs/dist/pdf/{pt,en,es}/` e, por idioma, `docs/dist/pdf/<lang>/iot-monitoring-uml-combined.pdf`.

Na SPA (`code/frontend`), a rota **`/documentation`** escolhe automaticamente o conjunto de SVG conforme o idioma (pt-BR → `public/uml/pt/`, English → `en/`, Español → `es/`). Depois de alterar os `.puml` e gerar os SVG:

```bash
cd code/frontend && npm run sync-uml
```