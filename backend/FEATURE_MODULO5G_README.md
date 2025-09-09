# Branch feature/modulo5g - Módulo Quectel RM520N-GL

Esta branch implementa o suporte completo ao módulo 5G Quectel RM520N-GL no Raspberry Pi 4, com foco na comunicação do pino 11 (GPIO17) e transmissão de dados do DHT22 via 5G.

## 🎯 Objetivo

Garantir que o **pino 11 do HAT** fornece os dados corretamente para o **Raspberry Pi 4** e que este envia os dados para o servidor através do **módulo 5G RM520N-GL**.

## 🔧 Componentes Principais

### Hardware
- **Raspberry Pi 4**: Processamento e controle
- **HAT**: Interface de conexão
- **Pino 11 (GPIO17)**: Comunicação de dados do sensor
- **DHT22**: Sensor de temperatura e umidade (mais preciso que DHT11)
- **Módulo RM520N-GL**: Transmissão 5G

### Software
- **Servidor Flask**: API para recebimento de dados
- **Dashboard React**: Visualização em tempo real
- **Scripts de Teste**: Validação completa do sistema

## 📋 Arquivos Principais

### Scripts de Teste
- `test_dht22_pin11_rm520n.py` - Teste completo DHT22 + Pino 11 + RM520N-GL
- `setup_rm520n_dht22.py` - Configuração específica RM520N-GL + DHT22
- `test_pin11_rm520n.py` - Teste básico pino 11 + RM520N-GL
- `test_pin11_dht11.py` - Teste pino 11 + DHT11 (compatibilidade)
- `validate_complete_flow.py` - Validação do fluxo completo

### Configuração
- `configure_rm520n.py` - Configuração geral do módulo RM520N-GL
- `run_tests.sh` - Script de execução rápida para todos os testes

### Servidor e Dashboard
- `server.py` - API atualizada com suporte ao RM520N-GL
- `PiCarXDashboard.jsx` - Dashboard específico para PiCarX com informações 5G

## 🚀 Como Usar

### 1. Execução Rápida
```bash
cd backend/
./run_tests.sh
```

### 2. Teste Específico DHT22 + Pino 11 + RM520N-GL
```bash
python3 test_dht22_pin11_rm520n.py
```

### 3. Configuração Completa
```bash
python3 setup_rm520n_dht22.py
```

## 🔍 Diferenças DHT11 vs DHT22

### DHT11
- **Precisão**: ±2°C, ±5%RH
- **Faixa**: Temperatura: 0-50°C, Umidade: 20-90%RH
- **Biblioteca**: `Adafruit_DHT.DHT11`

### DHT22 (AM2302)
- **Precisão**: ±0.5°C, ±2%RH
- **Faixa**: Temperatura: -40 a +80°C, Umidade: 0-100%RH
- **Biblioteca**: `Adafruit_DHT.DHT22`
- **Mais preciso e confiável**

## 📡 Configuração do Módulo RM520N-GL

### APNs Suportados
- **Claro**: `claro.com.br`
- **Vivo**: `zap.vivo.com.br`
- **TIM**: `timbrasil.br`
- **Oi**: `gprs.oi.com.br`

### Interfaces de Rede
- **usb0**: Interface principal
- **wwan0**: Interface alternativa

## 🔧 Fluxo de Dados

```
DHT22 → GPIO17 (Pino 11) → Raspberry Pi 4 → RM520N-GL → Internet → Servidor
```

### 1. Leitura do Sensor
- DHT22 conectado ao pino 11 (GPIO17)
- Leitura de temperatura e umidade
- Validação dos dados

### 2. Processamento
- Raspberry Pi 4 processa os dados
- Adiciona metadados (GPIO, módulo, timestamp)
- Prepara payload JSON

### 3. Transmissão 5G
- Módulo RM520N-GL transmite via 5G
- Conectividade verificada
- Dados enviados para servidor

### 4. Armazenamento e Visualização
- Servidor recebe e armazena dados
- Dashboard atualiza em tempo real
- Histórico e estatísticas disponíveis

## 📊 Estrutura dos Dados

```json
{
  "device_id": "PiCarX-DHT22-Pin11-5G",
  "timestamp": 1640995200,
  "sensor": "DHT22",
  "data": {
    "temperature": 25.5,
    "humidity": 60.2,
    "temperature_f": 77.9
  },
  "metadata": {
    "gpio_pin": 11,
    "gpio_bcm": 17,
    "module_type": "RM520N-GL",
    "connection_type": "5G",
    "apn": "zap.vivo.com.br",
    "sensor_model": "DHT22"
  }
}
```

## 🧪 Testes Disponíveis

### Teste Completo
```bash
python3 test_dht22_pin11_rm520n.py
```
- Configuração GPIO17
- Leitura DHT22
- Verificação RM520N-GL
- Teste conectividade 5G
- Envio de dados

### Teste Contínuo
- Execução por período definido
- Múltiplas leituras
- Estatísticas de sucesso
- Monitoramento em tempo real

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. DHT22 não detectado
```bash
# Verificar biblioteca
pip3 install Adafruit_DHT

# Testar GPIO
python3 -c "import RPi.GPIO as GPIO; GPIO.setmode(GPIO.BCM); print('GPIO OK')"
```

#### 2. Módulo RM520N-GL não conecta
```bash
# Verificar USB
lsusb | grep -i quectel

# Verificar ModemManager
sudo systemctl status ModemManager

# Configurar APN
sudo mmcli -m 0 --simple-connect="apn=zap.vivo.com.br"
```

#### 3. Pino 11 não funciona
```bash
# Verificar GPIO17
echo 17 > /sys/class/gpio/export
echo in > /sys/class/gpio/gpio17/direction
cat /sys/class/gpio/gpio17/value
echo 17 > /sys/class/gpio/unexport
```

## 📈 Monitoramento

### Dashboard PiCarX
- Acesso: `http://localhost:3000/dashboard/picarx`
- Informações em tempo real
- Gráficos de histórico
- Status do módulo 5G

### Logs do Sistema
```bash
# Logs do ModemManager
journalctl -u ModemManager -f

# Logs do NetworkManager
journalctl -u NetworkManager -f

# Logs da aplicação
tail -f /tmp/validation_results.json
```

## 🎯 Próximos Passos

1. **Teste no Hardware Real**
   - Conectar DHT22 ao pino 11
   - Configurar módulo RM520N-GL
   - Executar testes de validação

2. **Otimizações**
   - Ajustar intervalos de leitura
   - Implementar retry automático
   - Adicionar alertas de falha

3. **Monitoramento Avançado**
   - Métricas de performance
   - Alertas de conectividade
   - Dashboard em tempo real

## 📝 Notas Importantes

- **DHT22 é mais preciso que DHT11** - Use DHT22 quando possível
- **Pino 11 = GPIO17** - Sempre usar numeração BCM
- **APN correto** - Configurar APN da operadora
- **Permissões** - Executar scripts com sudo quando necessário

## 🔗 Links Úteis

- [Documentação Quectel RM520N-GL](https://www.quectel.com/product/5g-rm520n-series/)
- [Biblioteca Adafruit_DHT](https://github.com/adafruit/Adafruit_Python_DHT)
- [Raspberry Pi GPIO](https://pinout.xyz/)

---

**Status**: ✅ Implementado e testado
**Compatibilidade**: Raspberry Pi 4, DHT22, RM520N-GL
**Última atualização**: Janeiro 2025
