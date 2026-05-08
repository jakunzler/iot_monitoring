# 🔧 CORREÇÕES DO PiCarX - PROBLEMAS IDENTIFICADOS E SOLUÇÕES

## ✅ **PROBLEMAS IDENTIFICADOS**

### **1. Interface de Rede Incorreta**
- **Problema**: Script estava tentando usar `usb0` (módulo 5G)
- **Realidade**: PiCarX está conectado via `wlan0` (WiFi)
- **IP Correto**: `10.105.174.64` (conforme `ip a` do usuário)

### **2. Biblioteca DHT22 Incorreta**
- **Problema**: Script estava usando `adafruit_dht` (nova biblioteca)
- **Realidade**: PiCarX usa `Adafruit_DHT` (biblioteca clássica)
- **Correção**: Voltar para `Adafruit_DHT.read_retry()`

### **3. Problemas de Checksum**
- **Problema**: "Checksum did not validate. Try again."
- **Causa**: Sensor DHT22 com problemas de comunicação
- **Solução**: Usar `read_retry()` com retry automático

## 🔧 **CORREÇÕES IMPLEMENTADAS**

### **1. Variante legacy (`publish_picarx_dht22_fixed.py`) — hoje em `code/publisher/deprecated/`**

O fluxo suportado no repositório é **`code/publisher/publish_picarx_dht22.py`** + serviço **`picarx-dht22-publisher`** (`systemd/`). O script `*_fixed.py` mantém-se só como referência.

#### **Interface de Rede Corrigida:**
```python
def get_network_info():
    """Obter informações da rede WiFi (wlan0)"""
    try:
        import subprocess
        result = subprocess.run(['ip', 'addr', 'show', 'wlan0'], 
                              capture_output=True, text=True)
        if 'inet' in result.stdout:
            for line in result.stdout.split('\n'):
                if 'inet' in line and 'wlan0' in result.stdout:
                    ip = line.split()[1].split('/')[0]
                    return ip
        return "10.105.174.64"  # IP padrão do WiFi
    except:
        return "10.105.174.64"
```

#### **Biblioteca DHT22 Corrigida:**
```python
import Adafruit_DHT

def read_sensor():
    """Ler dados do sensor DHT22"""
    try:
        humidity, temperature = Adafruit_DHT.read_retry(SENSOR_TYPE, GPIO_PIN)
        
        if humidity is not None and temperature is not None:
            return {
                'temperature': round(temperature, 1),
                'humidity': round(humidity, 1),
                'temperature_f': round(temperature * 9/5 + 32, 1)
            }
        else:
            logger.warning("Falha na leitura do sensor")
            return None
    except Exception as e:
        logger.error(f"Erro ao ler sensor: {e}")
        return None
```

#### **Tratamento de Erros Melhorado:**
```python
def send_data(data):
    """Enviar dados para o servidor com retry"""
    try:
        # ... código de envio ...
        
        # Tentar enviar dados com retry
        success = False
        for attempt in range(MAX_RETRIES):
            if send_data(sensor_data):
                success = True
                break
            else:
                if attempt < MAX_RETRIES - 1:
                    logger.warning(f"Tentativa {attempt + 1} falhou. Tentando novamente em {RETRY_DELAY}s...")
                    time.sleep(RETRY_DELAY)
        
        if not success:
            logger.error("❌ Falha ao enviar dados após todas as tentativas")
    except Exception as e:
        logger.error(f"❌ Erro inesperado: {e}")
```

## 🚀 **INSTRUÇÕES PARA EXECUÇÃO**

### **1. Recomendado: script do repositório + systemd**

```bash
cd caminho/para/iot_monitoring/scripts
./update-picarx-fixed.sh
```

Ou manualmente, a partir da raiz do clone:

```bash
scp code/publisher/publish_picarx_dht22.py pi@10.105.174.64:/home/pi/publisher/publish_picarx_dht22.py
scp code/publisher/install-systemd.sh pi@PI:/home/pi/publisher/
scp -r code/publisher/systemd pi@PI:/home/pi/publisher/
```

Na Pi: `pip3 install --user -r /home/pi/publisher/requirements.txt`, edite **`/etc/default/picarx-dht22-publisher`**, execute **`./install-systemd.sh`** em `/home/pi/publisher/`.

### **2. Logs**

```bash
ssh pi@10.105.174.64 "sudo journalctl -u picarx-dht22-publisher -f"
```

O ficheiro **`/home/pi/publisher/publish_picarx_dht22.log`** só aplica-se à variante legacy `publish_picarx_dht22_fixed.py` (`code/publisher/deprecated/`).

## 🧪 **VERIFICAÇÕES**

### **1. Testar Conectividade**
```bash
# Do seu computador
ping 10.105.174.64

# Do PiCarX
ping 200.137.220.50
```

### **2. Testar Envio de Dados**
```bash
# Do PiCarX
curl -X POST "http://200.137.220.50:8080/api/ingest" \
  -H "Content-Type: application/json" \
  -d '{"device_id": "PiCarX-RM520N-DHT22", "temperature": 32.0, "humidity": 35.0, "timestamp": '$(date +%s)'}'
```

### **3. Verificar Dados no Servidor**
```bash
curl "http://200.137.220.50:8080/api/latest/PiCarX-RM520N-DHT22" | jq .
```

## 📋 **CARACTERÍSTICAS DO SCRIPT CORRIGIDO**

### **✅ Funcionalidades:**
- **Interface WiFi**: Usa `wlan0` (IP: 10.105.174.64)
- **Biblioteca Correta**: `Adafruit_DHT` (não `adafruit_dht`)
- **Retry Automático**: 3 tentativas em caso de falha
- **Logs Detalhados**: Arquivo e console
- **Tratamento de Erros**: Robusto e informativo
- **Intervalo Configurável**: 30 segundos entre leituras

### **✅ Tratamento de Problemas:**
- **Checksum Errors**: `read_retry()` resolve automaticamente
- **Falhas de Rede**: Retry com delay
- **Dados Inválidos**: Validação antes do envio
- **Logs Claros**: Fácil diagnóstico de problemas

## 🎯 **RESULTADO ESPERADO**

Após aplicar as correções:

1. **✅ Sensor Funcionando**: Leitura estável sem erros de checksum
2. **✅ Rede Funcionando**: Conectividade via WiFi estável
3. **✅ Dados Enviados**: Script enviando dados para o servidor
4. **✅ Dashboard Atualizado**: Frontend mostrando dados do PiCarX
5. **✅ Logs Informativos**: Fácil monitoramento e diagnóstico

## 🚨 **TROUBLESHOOTING**

### **Se ainda houver problemas:**

1. **Verificar Logs:**
   ```bash
   ssh pi@10.105.174.64 "sudo journalctl -u picarx-dht22-publisher -f"
   ```

2. **Verificar Conectividade:**
   ```bash
   ssh pi@10.105.174.64 "ping -c 3 200.137.220.50"
   ```

3. **Testar Sensor:**
   ```bash
   ssh pi@10.105.174.64 "python3 -c 'import Adafruit_DHT; print(Adafruit_DHT.read_retry(Adafruit_DHT.DHT22, 11))'"
   ```

4. **Verificar Processo:**
   ```bash
   ssh pi@10.105.174.64 "ps aux | grep publish_picarx"
   ```

**O script corrigido deve resolver todos os problemas identificados e fazer o PiCarX enviar dados corretamente para o servidor!** 🚀
