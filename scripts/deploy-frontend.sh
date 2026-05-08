#!/bin/bash

# Script de Deploy Individual - Frontend React

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CODE_DIR="$(cd "$SCRIPT_DIR/../code" && pwd)"
cd "$CODE_DIR"

# Configurações
PROJECT_ID=${PROJECT_ID:-"your-project-id"}
REGION=${REGION:-"us-central1"}
SERVICE_NAME="dht22-frontend"
BACKEND_URL=${BACKEND_URL:-"https://dht22-backend-HASH-uc.a.run.app"}

echo "⚛️ Deploy do Frontend React para Cloud Run"
echo "Projeto: $PROJECT_ID"
echo "Região: $REGION"
echo "Backend URL: $BACKEND_URL"
echo ""

# Configurar projeto
gcloud config set project $PROJECT_ID
gcloud config set run/region $REGION

# Build da imagem
echo "Construindo imagem do frontend..."
gcloud builds submit ./frontend --tag gcr.io/$PROJECT_ID/$SERVICE_NAME:latest

# Deploy no Cloud Run
echo "Deployando no Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image gcr.io/$PROJECT_ID/$SERVICE_NAME:latest \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --port 80 \
    --memory 512Mi \
    --cpu 1 \
    --min-instances 1 \
    --max-instances 10 \
    --set-env-vars "REACT_APP_API_URL=${BACKEND_URL}"

# Obter URL
FRONTEND_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")
echo ""
echo "✅ Frontend deployado com sucesso!"
echo "🌐 URL: $FRONTEND_URL"
echo "📊 Dashboard: $FRONTEND_URL/dashboard"
