# 🚀 Deploy Completo - DHT22 IoT System

Este guia explica como fazer o deploy completo do sistema DHT22 no Google Cloud Platform (GCP) usando Cloud Run.

## 📋 Arquitetura

O sistema consiste em dois serviços independentes:

1. **Backend Flask** (`backend/`) - API para receber dados dos sensores
2. **Frontend React** (raiz) - Dashboard para visualizar os dados

## 🛠️ Pré-requisitos

- Conta no Google Cloud Platform
- `gcloud` CLI instalado e configurado
- Docker instalado (para testes locais)
- Projeto GCP criado

## 📁 Estrutura de Arquivos

```
├── Dockerfile.backend          # Container do backend Flask
├── Dockerfile.frontend         # Container do frontend React
├── nginx.conf                   # Configuração Nginx para frontend
├── cloudrun-backend.yaml       # Configuração Cloud Run backend
├── cloudrun-frontend.yaml      # Configuração Cloud Run frontend
├── deploy-complete.sh          # Script de deploy completo
├── deploy-backend.sh           # Script de deploy apenas backend
├── deploy-frontend.sh          # Script de deploy apenas frontend
├── test-local-builds.sh        # Script para testar builds locais
├── .env.example               # Exemplo de variáveis de ambiente
└── DEPLOY_GUIDE.md            # Este arquivo
```

## 🚀 Deploy Completo (Recomendado)

### 1. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar com suas configurações
nano .env
```

### 2. Executar Deploy Completo

```bash
# Tornar script executável
chmod +x deploy-complete.sh

# Executar deploy
./deploy-complete.sh
```

O script irá:
- ✅ Verificar configuração do gcloud
- ✅ Configurar projeto GCP
- ✅ Build e deploy do backend
- ✅ Build e deploy do frontend
- ✅ Testar ambos os serviços
- ✅ Exibir URLs finais

## 🔧 Deploy Individual

### Deploy Apenas Backend

```bash
chmod +x deploy-backend.sh
export PROJECT_ID="seu-projeto-id"
./deploy-backend.sh
```

### Deploy Apenas Frontend

```bash
chmod +x deploy-frontend.sh
export PROJECT_ID="seu-projeto-id"
export BACKEND_URL="https://dht22-backend-HASH-uc.a.run.app"
./deploy-frontend.sh
```

## 🧪 Testes Locais

Antes do deploy, teste os builds localmente:

```bash
chmod +x test-local-builds.sh
./test-local-builds.sh
```

## 📊 Configurações dos Serviços

### Backend Flask
- **Porta**: 8080
- **Memória**: 512Mi
- **CPU**: 1
- **Instâncias**: 1-10
- **Banco**: SQLite em `/tmp/dht22_data.db`

### Frontend React
- **Porta**: 80 (Nginx)
- **Memória**: 512Mi
- **CPU**: 1
- **Instâncias**: 1-10
- **Proxy**: Nginx para SPA

## 🔗 URLs dos Serviços

Após o deploy, você terá:

- **Backend API**: `https://dht22-backend-HASH-uc.a.run.app`
- **Frontend Dashboard**: `https://dht22-frontend-HASH-uc.a.run.app`

## 📡 Configuração dos Sensores

Após o deploy, atualize os sensores para enviar dados para o novo backend:

### ESP32
```cpp
const char* serverUrl = "https://dht22-backend-HASH-uc.a.run.app/api/ingest";
```

### PiCarX (Python)
```python
PUBLISH_URL = "https://dht22-backend-HASH-uc.a.run.app/api/ingest"
```

## 🔍 Monitoramento

### Logs do Backend
```bash
gcloud logs read --service=dht22-backend --limit=50
```

### Logs do Frontend
```bash
gcloud logs read --service=dht22-frontend --limit=50
```

### Status dos Serviços
```bash
gcloud run services list
```

## 🛠️ Troubleshooting

### Problema: Build falha
- Verifique se todas as dependências estão no `requirements.txt` (backend) ou `package.json` (frontend)
- Execute `./test-local-builds.sh` para testar localmente

### Problema: Serviço não responde
- Verifique logs: `gcloud logs read --service=SERVICE_NAME`
- Verifique se a porta está correta (8080 para backend, 80 para frontend)

### Problema: Frontend não conecta ao backend
- Verifique se `REACT_APP_API_URL` está correto
- Verifique se o backend está acessível publicamente

## 🔄 Atualizações

Para atualizar um serviço:

```bash
# Backend
./deploy-backend.sh

# Frontend
./deploy-frontend.sh

# Ambos
./deploy-complete.sh
```

## 💰 Custos

Cloud Run cobra apenas pelo uso:
- **CPU**: Durante execução
- **Memória**: Durante execução
- **Requests**: Por requisição
- **Instâncias mínimas**: Sempre ativas

Para economizar, reduza `min-instances` para 0.

## 📞 Suporte

Em caso de problemas:
1. Verifique logs do serviço
2. Teste builds locais
3. Verifique configurações do projeto GCP
4. Consulte documentação do Cloud Run
