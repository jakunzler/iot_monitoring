# Deploy do frontend (Cloud Build + Cloud Run) — permissões GCP

Erros comuns ao correr `./scripts/deploy-frontend.sh` e como corrigir no projeto (precisas de papel **Owner**, **Editor** ou IAM adequado).

Substitui `PROJECT_ID` e, se necessário, o número do projecto `PN` (obtido com `gcloud projects describe PROJECT_ID --format='value(projectNumber)'`).

---

## 1. Erro `storage.objects.get` / 403 no upload do source

O Cloud Build grava o tarball em `gs://PROJECT_ID_cloudbuild/`. A conta de serviço usada precisa de acesso a **Storage**.

```bash
PN=$(gcloud projects describe PROJECT_ID --format='value(projectNumber)')
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:${PN}@cloudbuild.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"
```

(Em muitos projetos basta esta; às vezes também a conta `*-compute@developer.gserviceaccount.com` precisa de **objectViewer** no mesmo projeto.)

---

## 2. Aviso: `does not have permission to write logs to Cloud Logging`

Aparece quando o build usa **`CLOUD_LOGGING_ONLY`** no `cloudbuild.yaml` e a conta do worker (muitas vezes **`PN-compute@developer.gserviceaccount.com`**) não tem **Logs Writer**.

**Opção A — Dar permissão (recomendado se quiseres logs só no Logging):**

```bash
PN=$(gcloud projects describe PROJECT_ID --format='value(projectNumber)')
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:${PN}-compute@developer.gserviceaccount.com" \
  --role="roles/logging.logWriter"
```

**Opção B —** Neste repositório o `code/frontend/cloudbuild.yaml` usa **`GCS_ONLY`**, para os logs irem para o bucket do Cloud Build e **não** exigirem este papel. Se ainda vires o aviso, confirma que fizeste **pull** do último `cloudbuild.yaml`.

---

## 3. Build falha ao fazer **push** da imagem para `gcr.io/...`

O registo **Container Registry** (prefixo `gcr.io`) usa buckets de **Storage** no projeto. A conta que executa o passo docker push precisa de permissões de escrita.

```bash
PN=$(gcloud projects describe PROJECT_ID --format='value(projectNumber)')
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:${PN}-compute@developer.gserviceaccount.com" \
  --role="roles/storage.admin"
```

*(Alternativa mais restrita: papéis específicos do Artifact Registry se migrares para `REGION-docker.pkg.dev`.)*

---

## 4. Ver o erro real do Docker (build falhou com `FAILURE`)

O resumo do `gcloud builds submit` nem sempre mostra a linha do `docker build`. Usa:

```bash
gcloud builds list --limit=5
gcloud builds log BUILD_ID
```

Ou abre o link que o comando imprime na consola **Cloud Build**.

---

## 5. APIs

```bash
gcloud services enable cloudbuild.googleapis.com run.googleapis.com --project=PROJECT_ID
```

---

## 6. Ficheiros no repositório

| Ficheiro | Função |
|----------|--------|
| `scripts/deploy-frontend.sh` | `gcloud builds submit`, `gcloud run deploy` |
| `code/frontend/cloudbuild.yaml` | Imagem Docker com `VITE_API_URL` |
| `code/frontend/.gcloudignore` | Exclui `node_modules`, `dist`, etc., do upload |
