# Deploy completo - DHT22 IoT System (GCP / Cloud Run)

Guia orientativo para deploy no Google Cloud. Os scripts efetivos foram movidos para pastas **`code/`** e **`scripts/`**.

## Arquitetura

1. **Backend Flask** (`code/backend/`) – API REST
2. **Frontend React** (`code/frontend/`) – SPA (Vite)
3. **Publisher na Pi** (`code/publisher/`) – opcionalmente fora da GCP

## Estrutura relevante no repositório

```text
iot_monitoring/
├── code/
│   ├── backend/Dockerfile
│   ├── frontend/Dockerfile
│   ├── docker-compose.yml
│   ├── Dockerfile.cloudrun
│   ├── cloudrun-backend.yaml
│   └── cloudrun-frontend.yaml
└── scripts/
    ├── deploy-complete.sh
    ├── deploy-backend.sh      # faz cd implícito para code/backend
    ├── deploy-frontend.sh
    ├── deploy-cloudrun.sh     # faz cd implícito para code/
    └── test-local-builds.sh
```

## Deploy completo (Cloud Run)

A partir da raiz do clone:

```bash
cd scripts
chmod +x deploy-complete.sh
export PROJECT_ID="seu-project-id"
./deploy-complete.sh
```

O script assume o repositório no nível pai (`scripts/` -> `../code/`).

## Deploy individual

```bash
cd scripts
./deploy-backend.sh
./deploy-frontend.sh    # PROJECT_ID / BACKEND_URL conforme cabeçalho do script
```

## Variáveis / exemplos

- `code/cloudrun-config.env`
- Documentação complementar: `docs/CLOUDRUN_DEPLOY.md`

## Testes locais de imagens

```bash
cd scripts
./test-local-builds.sh
```

Constrói `code/backend` e `code/frontend` como contextos Docker.
