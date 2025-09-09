# Deploy do Servidor DHT22 no Google Cloud Run

Este documento descreve como fazer o deploy do servidor DHT22 no Google Cloud Run para receber dados do módulo 5G.

## 📋 Pré-requisitos

1. **Google Cloud Account** com billing habilitado
2. **Google Cloud CLI** instalado e configurado
3. **Docker** instalado
4. **jq** para processamento JSON (opcional)

## 🚀 Deploy Rápido

### 1. Configurar o Projeto

```bash
# Editar o arquivo de configuração
nano cloudrun-config.env

# Substituir "your-project-id" pelo seu Project ID real
PROJECT_ID="seu-project-id"
```

### 2. Executar o Deploy

```bash
# Tornar o script executável (se ainda não estiver)
chmod +x deploy-cloudrun.sh

# Executar o deploy
./deploy-cloudrun.sh
```

### 3. Atualizar o Módulo 5G

Após o deploy, você receberá uma URL do Cloud Run. Use-a para atualizar o PiCarX:

```bash
# Substituir pela URL real do seu Cloud Run
./update-picarx-cloudrun.sh https://dht22-server-xxxxx-uc.a.run.app
```

## 🔧 Configuração Manual

### 1. Configurar Google Cloud

```bash
# Fazer login
gcloud auth login

# Configurar projeto
gcloud config set project SEU_PROJECT_ID

# Habilitar APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

### 2. Construir e Enviar Imagem

```bash
# Configurar Docker para Container Registry
gcloud auth configure-docker

# Construir imagem
docker build -f Dockerfile.cloudrun -t gcr.io/SEU_PROJECT_ID/dht22-server:latest .

# Enviar imagem
docker push gcr.io/SEU_PROJECT_ID/dht22-server:latest
```

### 3. Deploy no Cloud Run

```bash
gcloud run deploy dht22-server \
    --image gcr.io/SEU_PROJECT_ID/dht22-server:latest \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --port 8080 \
    --memory 512Mi \
    --cpu 1 \
    --max-instances 10 \
    --min-instances 0 \
    --timeout 300 \
    --concurrency 1000 \
    --set-env-vars "PORT=8080,FLASK_ENV=production,DATABASE_FILE=/tmp/dht22_data.db,MAX_RECORDS=1000"
```

## 📊 Monitoramento

### Health Check

```bash
# Verificar status do serviço
curl https://SUA_URL_CLOUD_RUN/api/health
```

### Logs

```bash
# Ver logs em tempo real
gcloud run services logs tail dht22-server --region=us-central1

# Ver logs recentes
gcloud run services logs read dht22-server --region=us-central1 --limit=50
```

### Métricas

```bash
# Ver métricas do serviço
gcloud run services describe dht22-server --region=us-central1
```

## 🔄 Atualizações

### Atualizar Código

```bash
# Fazer alterações no código
# Reconstruir e enviar imagem
docker build -f Dockerfile.cloudrun -t gcr.io/SEU_PROJECT_ID/dht22-server:latest .
docker push gcr.io/SEU_PROJECT_ID/dht22-server:latest

# Deploy da nova versão
gcloud run deploy dht22-server \
    --image gcr.io/SEU_PROJECT_ID/dht22-server:latest \
    --region us-central1
```

### Rollback

```bash
# Listar revisões
gcloud run revisions list --service=dht22-server --region=us-central1

# Fazer rollback para revisão anterior
gcloud run services update-traffic dht22-server \
    --to-revisions=REVISION_NAME=100 \
    --region=us-central1
```

## 🛠️ Configurações Avançadas

### Variáveis de Ambiente

```bash
# Adicionar variáveis de ambiente
gcloud run services update dht22-server \
    --region=us-central1 \
    --set-env-vars "NOVA_VARIAVEL=valor"
```

### Recursos

```bash
# Ajustar recursos
gcloud run services update dht22-server \
    --region=us-central1 \
    --memory=1Gi \
    --cpu=2
```

### Escalabilidade

```bash
# Configurar escalabilidade
gcloud run services update dht22-server \
    --region=us-central1 \
    --min-instances=1 \
    --max-instances=20
```

## 🔒 Segurança

### Autenticação

```bash
# Remover acesso público (requer autenticação)
gcloud run services remove-iam-policy-binding dht22-server \
    --region=us-central1 \
    --member="allUsers" \
    --role="roles/run.invoker"
```

### Domínio Personalizado

```bash
# Mapear domínio personalizado
gcloud run domain-mappings create \
    --service=dht22-server \
    --domain=api.seudominio.com \
    --region=us-central1
```

## 📈 Custos

### Estimativa de Custos

- **CPU**: $0.00002400 por vCPU-segundo
- **Memória**: $0.00000250 por GB-segundo
- **Requisições**: $0.40 por milhão de requisições
- **Instâncias**: Gratuito até 2 milhões de requisições/mês

### Otimização de Custos

```bash
# Configurar para escala zero
gcloud run services update dht22-server \
    --region=us-central1 \
    --min-instances=0
```

## 🐛 Troubleshooting

### Problemas Comuns

1. **Erro de Build**
   ```bash
   # Verificar logs do build
   gcloud builds list
   gcloud builds log BUILD_ID
   ```

2. **Serviço não responde**
   ```bash
   # Verificar logs do serviço
   gcloud run services logs read dht22-server --region=us-central1
   ```

3. **Erro de CORS**
   - Verificar se o CORS está habilitado no código
   - Verificar headers de resposta

### Debug

```bash
# Executar container localmente
docker run -p 8080:8080 gcr.io/SEU_PROJECT_ID/dht22-server:latest

# Testar localmente
curl http://localhost:8080/api/health
```

## 📚 Recursos Adicionais

- [Documentação do Cloud Run](https://cloud.google.com/run/docs)
- [Container Registry](https://cloud.google.com/container-registry)
- [Cloud Build](https://cloud.google.com/build)
- [Pricing Calculator](https://cloud.google.com/products/calculator)

## ✅ Checklist de Deploy

- [ ] Google Cloud CLI configurado
- [ ] Projeto criado e billing habilitado
- [ ] APIs habilitadas
- [ ] Docker instalado
- [ ] Arquivo de configuração atualizado
- [ ] Deploy executado com sucesso
- [ ] Health check funcionando
- [ ] Módulo 5G atualizado com nova URL
- [ ] Dados chegando no Cloud Run
- [ ] Monitoramento configurado
