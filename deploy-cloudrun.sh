#!/bin/bash
# Script de deploy para Google Cloud Run

set -e

# Configurações
PROJECT_ID="steel-climber-466411-d1"
SERVICE_NAME="dht22-server"
REGION="us-central1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "=== DEPLOY DHT22 SERVER PARA GOOGLE CLOUD RUN ==="
echo "Project ID: ${PROJECT_ID}"
echo "Service: ${SERVICE_NAME}"
echo "Region: ${REGION}"
echo "Image: ${IMAGE_NAME}"
echo "================================================"

# Verificar se gcloud está instalado
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud CLI não encontrado. Instale em: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não encontrado. Instale Docker primeiro."
    exit 1
fi

# Configurar projeto
echo "Configurando projeto..."
gcloud config set project ${PROJECT_ID}

# Habilitar APIs necessárias
echo "Habilitando APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Fazer login no Container Registry
echo "Fazendo login no Container Registry..."
gcloud auth configure-docker

# Construir imagem Docker
echo "Construindo imagem Docker..."
docker build -f Dockerfile.cloudrun -t ${IMAGE_NAME}:latest .

# Enviar imagem para Container Registry
echo "Enviando imagem para Container Registry..."
docker push ${IMAGE_NAME}:latest

# Deploy no Cloud Run
echo "Fazendo deploy no Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
    --image ${IMAGE_NAME}:latest \
    --platform managed \
    --region ${REGION} \
    --allow-unauthenticated \
    --port 8080 \
    --memory 512Mi \
    --cpu 1 \
    --max-instances 10 \
    --min-instances 0 \
    --timeout 300 \
    --concurrency 1000 \
    --set-env-vars "PORT=8080,FLASK_ENV=production,DATABASE_FILE=dht22_data.db,MAX_RECORDS=100"

# Obter URL do serviço
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --format='value(status.url)')

echo ""
echo "=== DEPLOY CONCLUÍDO COM SUCESSO! ==="
echo "URL do serviço: ${SERVICE_URL}"
echo "Health check: ${SERVICE_URL}/api/health"
echo "API endpoint: ${SERVICE_URL}/api/ingest"
echo ""
echo "Para testar:"
echo "curl ${SERVICE_URL}/api/health"
echo ""
echo "Para atualizar o módulo 5G, use esta URL:"
echo "PUBLISH_URL=${SERVICE_URL}/api/ingest"
echo "================================================"

# Testar o serviço
echo "Testando o serviço..."
sleep 10
curl -s "${SERVICE_URL}/api/health" | jq . || echo "Serviço ainda não está respondendo"

echo ""
echo "✅ Deploy concluído!"
