#!/bin/bash

# Script de Deploy Completo para GCP Cloud Run
# Backend Flask + Frontend React

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
PROJECT_ID=${PROJECT_ID:-"steel-climber-466411-d1"}
REGION=${REGION:-"us-central1"}
BACKEND_SERVICE="dht22-backend"
FRONTEND_SERVICE="dht22-frontend"

echo -e "${BLUE}🚀 Iniciando deploy completo para GCP Cloud Run${NC}"
echo -e "${YELLOW}Projeto: ${PROJECT_ID}${NC}"
echo -e "${YELLOW}Região: ${REGION}${NC}"
echo ""

# Função para verificar se o gcloud está configurado
check_gcloud() {
    if ! command -v gcloud &> /dev/null; then
        echo -e "${RED}❌ gcloud CLI não encontrado. Instale primeiro.${NC}"
        exit 1
    fi
    
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        echo -e "${RED}❌ Não há conta ativa no gcloud. Execute: gcloud auth login${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ gcloud configurado corretamente${NC}"
}

# Função para configurar projeto
setup_project() {
    echo -e "${BLUE}🔧 Configurando projeto GCP...${NC}"
    gcloud config set project $PROJECT_ID
    gcloud config set run/region $REGION
    
    # Habilitar APIs necessárias
    echo -e "${YELLOW}Habilitando APIs...${NC}"
    gcloud services enable cloudbuild.googleapis.com
    gcloud services enable run.googleapis.com
    gcloud services enable containerregistry.googleapis.com
    
    echo -e "${GREEN}✅ Projeto configurado${NC}"
}

# Função para build e deploy do backend
deploy_backend() {
    echo -e "${BLUE}🐳 Build e deploy do Backend Flask...${NC}"
    
    # Build da imagem
    echo -e "${YELLOW}Construindo imagem do backend...${NC}"
    gcloud builds submit . --tag gcr.io/$PROJECT_ID/$BACKEND_SERVICE:latest --dockerfile=Dockerfile.backend .
    
    # Deploy no Cloud Run
    echo -e "${YELLOW}Deployando backend no Cloud Run...${NC}"
    gcloud run deploy $BACKEND_SERVICE \
        --image gcr.io/$PROJECT_ID/$BACKEND_SERVICE:latest \
        --platform managed \
        --region $REGION \
        --allow-unauthenticated \
        --port 8080 \
        --memory 512Mi \
        --cpu 1 \
        --min-instances 1 \
        --max-instances 10 \
        --set-env-vars "FLASK_ENV=production,DATABASE_FILE=/tmp/dht22_data.db,PORT=8080"
    
    # Obter URL do backend
    BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE --region=$REGION --format="value(status.url)")
    echo -e "${GREEN}✅ Backend deployado: ${BACKEND_URL}${NC}"
    
    # Exportar URL para uso no frontend
    export BACKEND_URL
}

# Função para build e deploy do frontend
deploy_frontend() {
    echo -e "${BLUE}⚛️ Build e deploy do Frontend React...${NC}"
    
    # Atualizar configuração do frontend com URL do backend
    if [ -z "$BACKEND_URL" ]; then
        echo -e "${RED}❌ URL do backend não encontrada${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}Backend URL: ${BACKEND_URL}${NC}"
    
    # Build da imagem
    echo -e "${YELLOW}Construindo imagem do frontend...${NC}"
    gcloud builds submit --tag gcr.io/$PROJECT_ID/$FRONTEND_SERVICE:latest -f Dockerfile.frontend .
    
    # Deploy no Cloud Run
    echo -e "${YELLOW}Deployando frontend no Cloud Run...${NC}"
    gcloud run deploy $FRONTEND_SERVICE \
        --image gcr.io/$PROJECT_ID/$FRONTEND_SERVICE:latest \
        --platform managed \
        --region $REGION \
        --allow-unauthenticated \
        --port 80 \
        --memory 512Mi \
        --cpu 1 \
        --min-instances 1 \
        --max-instances 10 \
        --set-env-vars "REACT_APP_API_URL=${BACKEND_URL}"
    
    # Obter URL do frontend
    FRONTEND_URL=$(gcloud run services describe $FRONTEND_SERVICE --region=$REGION --format="value(status.url)")
    echo -e "${GREEN}✅ Frontend deployado: ${FRONTEND_URL}${NC}"
}

# Função para testar os serviços
test_services() {
    echo -e "${BLUE}🧪 Testando serviços...${NC}"
    
    # Testar backend
    echo -e "${YELLOW}Testando backend...${NC}"
    if curl -s "$BACKEND_URL/api/health" > /dev/null; then
        echo -e "${GREEN}✅ Backend respondendo${NC}"
    else
        echo -e "${RED}❌ Backend não está respondendo${NC}"
    fi
    
    # Testar frontend
    echo -e "${YELLOW}Testando frontend...${NC}"
    if curl -s "$FRONTEND_URL/health" > /dev/null; then
        echo -e "${GREEN}✅ Frontend respondendo${NC}"
    else
        echo -e "${RED}❌ Frontend não está respondendo${NC}"
    fi
}

# Função principal
main() {
    echo -e "${BLUE}🎯 Deploy Completo - DHT22 IoT System${NC}"
    echo ""
    
    check_gcloud
    setup_project
    deploy_backend
    deploy_frontend
    test_services
    
    echo ""
    echo -e "${GREEN}🎉 Deploy concluído com sucesso!${NC}"
    echo -e "${BLUE}📊 Backend: ${BACKEND_URL}${NC}"
    echo -e "${BLUE}🌐 Frontend: ${FRONTEND_URL}${NC}"
    echo ""
    echo -e "${YELLOW}📝 Próximos passos:${NC}"
    echo -e "1. Atualizar PUBLISH_URL nos módulos para: ${BACKEND_URL}/api/ingest"
    echo -e "2. Testar envio de dados dos sensores"
    echo -e "3. Verificar dashboard no frontend"
}

# Executar se chamado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
