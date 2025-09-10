#!/bin/bash

# Script de Deploy Individual - Backend Flask

set -e

# Configurações
PROJECT_ID=${PROJECT_ID:-"steel-climber-466411-d1"}
REGION=${REGION:-"us-central1"}
SERVICE_NAME="dht22-backend"

echo "🐳 Deploy do Backend Flask para Cloud Run"
echo "Projeto: $PROJECT_ID"
echo "Região: $REGION"
echo ""

# Configurar projeto
gcloud config set project $PROJECT_ID
gcloud config set run/region $REGION

# Build da imagem
echo "Construindo imagem do backend..."
gcloud builds submit . --tag gcr.io/$PROJECT_ID/$SERVICE_NAME:latest

# Deploy no Cloud Run
echo "Deployando no Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image gcr.io/$PROJECT_ID/$SERVICE_NAME:latest \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --port 8080 \
    --memory 512Mi \
    --cpu 1 \
    --min-instances 1 \
    --max-instances 10 \
    --set-env-vars "FLASK_ENV=production,DATABASE_FILE=dht22_data.db"

# Obter URL
BACKEND_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")
echo ""
echo "✅ Backend deployado com sucesso!"
echo "🌐 URL: $BACKEND_URL"
echo "📡 Endpoint de ingestão: $BACKEND_URL/api/ingest"
