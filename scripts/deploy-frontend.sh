#!/bin/bash

# Deploy do frontend (Vite) para Cloud Run com imagem construída no Cloud Build.
# Carrega code/.env se existir (PROJECT_ID, REGION, BACKEND_URL / VITE_API_URL, etc.).

# --- Problemas comuns no Cloud Build / IAM ---
# Ver: docs/deployment/GCP_CLOUD_BUILD_FRONTEND.md
# Resumo: storage (source + gcr.io), opcional logging.logWriter, e builds log:
#   gcloud builds log BUILD_ID

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CODE_DIR="$(cd "$SCRIPT_DIR/../code" && pwd)"
ENV_FILE="$CODE_DIR/.env"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

PROJECT_ID="${PROJECT_ID:-iot-monitoring-495814}"
REGION="${REGION:-southamerica-west1}"
SERVICE_NAME="${FRONTEND_SERVICE:-dht22-frontend}"

# URL da API no bundle (prioridade: VITE_API_URL → BACKEND_URL → REACT_APP_API_URL)
EXPORT_VITE="${VITE_API_URL:-}"
if [[ -z "$EXPORT_VITE" ]]; then
  EXPORT_VITE="${BACKEND_URL:-}"
fi
if [[ -z "$EXPORT_VITE" ]]; then
  EXPORT_VITE="${REACT_APP_API_URL:-}"
fi
if [[ -z "$EXPORT_VITE" || "$EXPORT_VITE" == *"HASH"* ]]; then
  echo "Erro: defina VITE_API_URL ou BACKEND_URL em $ENV_FILE (URL real do backend Cloud Run), sem placeholder HASH." >&2
  exit 1
fi

FRONTEND_MEMORY="${FRONTEND_MEMORY:-512Mi}"
FRONTEND_CPU="${FRONTEND_CPU:-1}"
MIN_INSTANCES="${MIN_INSTANCES:-1}"
MAX_INSTANCES="${MAX_INSTANCES:-10}"

echo "⚛️  Deploy do frontend (Vite) para Cloud Run"
echo "    Projeto:     $PROJECT_ID"
echo "    Região:      $REGION"
echo "    Serviço:     $SERVICE_NAME"
echo "    VITE_API_URL (build): $EXPORT_VITE"
echo ""

cd "$CODE_DIR"

gcloud config set project "$PROJECT_ID"
gcloud config set run/region "$REGION"

echo "Construindo imagem (Cloud Build)..."
gcloud builds submit ./frontend \
  --config=./frontend/cloudbuild.yaml \
  --substitutions=_SERVICE_NAME="$SERVICE_NAME",_VITE_API_URL="$EXPORT_VITE"

echo "Publicando no Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
  --image "gcr.io/$PROJECT_ID/$SERVICE_NAME:latest" \
  --platform managed \
  --region "$REGION" \
  --allow-unauthenticated \
  --port 80 \
  --memory "$FRONTEND_MEMORY" \
  --cpu "$FRONTEND_CPU" \
  --min-instances "$MIN_INSTANCES" \
  --max-instances "$MAX_INSTANCES"

FRONTEND_URL="$(gcloud run services describe "$SERVICE_NAME" --region="$REGION" --format='value(status.url)')"
echo ""
echo "Frontend deployado."
echo "URL: $FRONTEND_URL"
echo ""
echo "Atualize FRONTEND_URL em $ENV_FILE se quiser documentar:"
echo "  FRONTEND_URL=$FRONTEND_URL"
