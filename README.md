# Sistema de Monitoramento IoT - ESP32 + DHT22

Sistema completo de monitoramento de temperatura e umidade utilizando ESP32, sensor DHT22 e interface web React.

## 🚀 Características

- **Monitoramento em Tempo Real**: Dados atualizados a cada 2.5 segundos
- **Interface Moderna**: Dashboard responsivo com Material-UI
- **Multi-idioma**: Suporte a Português, Inglês e Espanhol
- **Temas**: Modo claro e escuro
- **Gráficos Interativos**: Visualização de histórico com Chart.js
- **API REST**: Backend Flask com endpoints para dados
- **Deploy Cloud**: Configurado para Google Cloud Platform

## 🏗️ Arquitetura

```
ESP32 + DHT22 → Wi-Fi → Flask API → SQLite → React Dashboard
```

### Componentes

- **ESP32**: Microcontrolador com Wi-Fi integrado
- **DHT22**: Sensor de temperatura e umidade (±0.5°C, ±2% RH)
- **Flask Server**: API REST para processamento de dados
- **SQLite**: Banco de dados para armazenamento
- **React App**: Interface web responsiva

## 📦 Instalação

### Pré-requisitos

- Node.js 18+
- Python 3.11+
- Docker (opcional)

### Desenvolvimento Local

1. **Clone o repositório**
```bash
git clone https://github.com/your-username/publica-dht22-web.git
cd publica-dht22-web
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure o backend**
```bash
# Copie o servidor Flask do projeto original
cp ../utv-uav-jammer/jamming-iot/code/wifi/publica_dht22/server.py ./backend/
cp ../utv-uav-jammer/jamming-iot/code/wifi/publica_dht22/requirements.txt ./backend/
```

4. **Execute o servidor de desenvolvimento**
```bash
npm run dev
```

5. **Em outro terminal, execute o backend**
```bash
cd backend
pip install -r requirements.txt
python server.py
```

### Docker

```bash
# Build e execute com Docker Compose
docker-compose up --build
```

## 🔧 Configuração

### ESP32

1. **Instale as bibliotecas no Arduino IDE**:
   - DHT sensor library
   - WiFi library
   - ArduinoJson

2. **Configure as credenciais Wi-Fi**:
```cpp
const char* ssid = "SUA_REDE_WIFI";
const char* password = "SUA_SENHA";
```

3. **Configure o servidor**:
```cpp
const char* serverUrl = "http://SEU_IP:8080/api/ingest";
```

### Frontend

1. **Configure a URL da API**:
Edite `src/pages/Dashboard.jsx`:
```javascript
const API_BASE_URL = 'http://localhost:8080'; // Local
// const API_BASE_URL = 'https://seu-dominio.com'; // Produção
```

2. **Personalize as traduções**:
Edite os arquivos em `src/locales/`

## 🌐 Deploy

### Google Cloud Platform

1. **Instale o Google Cloud SDK**
```bash
gcloud init
```

2. **Configure o projeto**
```bash
gcloud config set project SEU_PROJETO_ID
```

3. **Build da aplicação**
```bash
npm run build
```

4. **Deploy no App Engine**
```bash
gcloud app deploy
```

### Docker

```bash
# Build da imagem
docker build -t publica-dht22-web .

# Execute o container
docker run -p 3000:80 publica-dht22-web
```

## 📊 API Endpoints

### GET `/api/latest/{device_id}`
Retorna a leitura mais recente do dispositivo.

**Resposta**:
```json
{
  "device_id": "ESP32-DHT22-Publisher",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "temperature": 25.5,
    "humidity": 60.2
  },
  "metadata": {
    "wifi_rssi": -45,
    "wifi_ip": "192.168.1.100",
    "uptime_seconds": 3600,
    "reading_number": 1440
  }
}
```

### GET `/api/history/{device_id}`
Retorna o histórico de leituras.

### GET `/api/stats/{device_id}`
Retorna estatísticas dos dados.

## 🎨 Personalização

### Temas

Os temas são definidos em `src/themes/index.js`:
- Modo claro: Cores suaves e legíveis
- Modo escuro: Cores escuras para conforto visual

### Idiomas

Adicione novos idiomas em `src/locales/`:
1. Crie arquivo `novo-idioma.json`
2. Adicione as traduções
3. Importe no `useTranslation.js`

## 🐛 Troubleshooting

### ESP32 não conecta ao Wi-Fi
- Verifique credenciais da rede
- Confirme se a rede está 2.4GHz
- Teste com `wifi_diagnostico.ino`

### Dados não aparecem no dashboard
- Verifique se o servidor Flask está rodando
- Confirme a URL da API no frontend
- Teste com `curl http://localhost:8080/api/latest/ESP32-DHT22-Publisher`

### Erro de CORS
- Configure o proxy no nginx
- Adicione headers CORS no Flask

## 📈 Monitoramento

### Métricas Importantes
- **Temperatura**: -40°C a +80°C
- **Umidade**: 0-100% RH
- **Frequência**: 2.5 segundos
- **Precisão**: ±0.5°C, ±2% RH

### Alertas
- Temperatura > 30°C
- Umidade > 80%
- Falha na comunicação
- Sensor offline

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 📞 Suporte

- **Email**: seu-email@exemplo.com
- **Issues**: [GitHub Issues](https://github.com/your-username/publica-dht22-web/issues)
- **Documentação**: [Wiki](https://github.com/your-username/publica-dht22-web/wiki)

---

**Desenvolvido com ❤️ para demonstração de tecnologias IoT**
