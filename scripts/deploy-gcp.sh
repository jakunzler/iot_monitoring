#!/bin/bash

# Script de Deploy para Google Cloud Platform
# Sistema de Monitoramento IoT - ESP32 + DHT22

set -e

echo "🚀 Iniciando deploy no Google Cloud Platform..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Verificar se gcloud está instalado
if ! command -v gcloud &> /dev/null; then
    error "Google Cloud SDK não está instalado. Instale em: https://cloud.google.com/sdk/docs/install"
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CODE_DIR="$REPO_ROOT/code"
FRONTEND_DIR="$CODE_DIR/frontend"

# Verificar se está logado
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    error "Você não está logado no Google Cloud. Execute: gcloud auth login"
fi

# Verificar se o projeto está configurado
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    error "Nenhum projeto configurado. Execute: gcloud config set project SEU_PROJETO_ID"
fi

log "Projeto configurado: $PROJECT_ID"

# Verificar se as APIs necessárias estão habilitadas
log "Verificando APIs necessárias..."

APIS=(
    "appengine.googleapis.com"
    "cloudbuild.googleapis.com"
    "containerregistry.googleapis.com"
)

for api in "${APIS[@]}"; do
    if ! gcloud services list --enabled --filter="name:$api" | grep -q "$api"; then
        log "Habilitando API: $api"
        gcloud services enable "$api"
    else
        log "API já habilitada: $api"
    fi
done

log "Construindo aplicação (frontend)..."
cd "$FRONTEND_DIR"
if [ ! -d node_modules ]; then
    log "Instalando dependências npm..."
    npm install
fi
if ! npm run build; then
    error "Falha no build da aplicação"
fi

if [ ! -d "dist" ]; then
    error "Diretório dist não encontrado após o build"
fi

cd "$CODE_DIR"

log "Build concluído com sucesso!"

# Deploy no App Engine
log "Fazendo deploy no App Engine..."
if gcloud app deploy app.yaml --quiet; then
    log "Deploy concluído com sucesso!"
    
    # Obter a URL da aplicação
    APP_URL=$(gcloud app browse --no-launch-browser 2>/dev/null | grep -o 'https://.*\.appspot\.com')
    
    if [ -n "$APP_URL" ]; then
        log "Aplicação disponível em: $APP_URL"
        echo ""
        echo -e "${BLUE}🎉 Deploy concluído!${NC}"
        echo -e "${BLUE}📊 Dashboard: $APP_URL${NC}"
        echo -e "${BLUE}📈 API: $APP_URL/api/latest/ESP32-DHT22-Publisher${NC}"
    fi
else
    error "Falha no deploy"
fi

# Configurações pós-deploy
log "Configurando domínio personalizado (opcional)..."
warning "Para usar domínio personalizado, configure no Console do App Engine"

log "Configurando monitoramento..."
warning "Configure alertas no Cloud Monitoring para monitorar a aplicação"

echo ""
log "Deploy finalizado! 🚀"
log "Próximos passos:"
echo "  1. Configure o ESP32 para apontar para: $APP_URL/api/ingest"
echo "  2. Teste a API: curl $APP_URL/api/latest/ESP32-DHT22-Publisher"
echo "  3. Configure monitoramento no Cloud Console"
echo "  4. Configure domínio personalizado se necessário"
