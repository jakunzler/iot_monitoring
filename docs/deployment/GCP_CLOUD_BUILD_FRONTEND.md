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

## 3. Push da imagem (Artifact Registry + `gcr.io`)

Em projectos actuais, **`gcr.io/PROJECT/IMAGE`** passa pelo **Artifact Registry**. O worker do Cloud Build precisa de papéis correctos; erros mudam conforme o repositório **já existe** ou não.

**Passo 1 — API**

```bash
gcloud services enable artifactregistry.googleapis.com --project=PROJECT_ID
```

**Passo 2 — IAM (recomendado para Cloud Build)**

Usa **`roles/artifactregistry.createOnPushWriter`**: inclui escrita **e** criação do repositório `gcr.io` na primeira vez (ver nota abaixo). O papel **`roles/artifactregistry.writer`** só serve para repositórios **já criados**; se o push for o primeiro e faltar permissão de criação, vês o erro de **createOnPush** (secção 3a).

```bash
PROJECT_ID=iot-monitoring-495814
PN=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')

for SA in \
  "${PN}@cloudbuild.gserviceaccount.com" \
  "${PN}-compute@developer.gserviceaccount.com"
do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${SA}" \
    --role="roles/artifactregistry.createOnPushWriter"
done
```

Volta a correr `./scripts/deploy-frontend.sh`.

**Nota (host `gcr.io`):** No Artifact Registry, o nome do repositório para esse host é fixo **`gcr.io`** na localização multi-região **`us`** ([documentação](https://cloud.google.com/artifact-registry/docs/transition/gcr-repositories)). A primeira gravação pode criar esse repositório automaticamente se a conta tiver **`createOnPush`**.

**Erro só `uploadArtifacts` (repositório já existe):** Se já criaste o repositório e só falta escrever, basta `roles/artifactregistry.writer` (ou mantém **createOnPushWriter**, que cobre os dois casos).

**Nota:** Em projectos antigos só com **Container Registry** “puro”, às vezes bastava `roles/storage.admin`; para AR + `gcr.io` usa os papéis acima.

---

## 3a. `gcr.io repo does not exist` / `createOnPush` permission

Mensagem típica:

```text
denied: gcr.io repo does not exist. Creating on push requires the artifactregistry.repositories.createOnPush permission
```

**Causa:** Ainda não existe o repositório AR **`gcr.io`** (localização **`us`**) no projeto, e a conta do push não tem permissão para **criar ao empurrar**.

**Correção A — IAM (alinhada com o passo 2 da secção 3):** garante **`roles/artifactregistry.createOnPushWriter`** nas contas **Cloud Build** e **Compute default** (comandos na secção 3).

**Correção B — Criar o repositório uma vez (opcional):**

```bash
PROJECT_ID=iot-monitoring-495814
gcloud artifacts repositories create gcr.io \
  --repository-format=docker \
  --location=us \
  --project="$PROJECT_ID" \
  --description="gcr.io compatibility (Artifact Registry)"
```

Depois **writer** pode bastar para pushes, mas **createOnPushWriter** continua a ser a opção mais simples se crias novas imagens / caminhos com frequência.

---

## 3b. (Legado) Push via Storage em projectos só GCR em bucket

Se ainda usares o modelo antigo só com **GCS** para `gcr.io` (raro em projetos novos):

```bash
PN=$(gcloud projects describe PROJECT_ID --format='value(projectNumber)')
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:${PN}-compute@developer.gserviceaccount.com" \
  --role="roles/storage.admin"
```

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
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  --project=PROJECT_ID
```

---

## 6. Ficheiros no repositório

| Ficheiro | Função |
|----------|--------|
| `scripts/deploy-frontend.sh` | `gcloud builds submit`, `gcloud run deploy` |
| `code/frontend/cloudbuild.yaml` | Imagem Docker com `VITE_API_URL` |
| `code/frontend/.gcloudignore` | Exclui `node_modules`, `dist`, etc., do upload |

---

## 7. Browser: dashboard no Cloud Run não carrega dados (CORS / `NetworkError` / IP em HTTPS)

O frontend no **Cloud Run** serve em **HTTPS** (`*.run.app`). Se o bundle (`VITE_API_URL`) apontar para **`https://200.x.x.x:8080`**, o browser tenta TLS contra um **IP**. Certificados públicos válidos para IP são raros; o pedido falha **antes** de CORS (`status (null)`, “CORS request did not succeed”).

**Solução usada neste repo:** build com **`VITE_API_URL=__SAME_ORIGIN__`** para o JavaScript chamar só **`/api/...`** no mesmo domínio; o **nginx** no container faz **proxy HTTP** para a VM. Em runtime, define **`BACKEND_PROXY_URL`** no serviço Cloud Run (ex.: `http://200.137.220.50:8080`). O script `deploy-frontend.sh` passa `BACKEND_PROXY_URL` a partir de `code/.env`.

Garante que a VM aceita **TCP 8080** a partir da internet (o egress do Cloud Run usa IPs Google variáveis). Se só dispositivos IoT escrevem na API, pode ser preciso abrir a porta para este proxy.
