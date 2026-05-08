# Módulo Quectel RM520N-GL - Configuração e Teste

Este documento descreve a configuração e teste do módulo 5G Quectel RM520N-GL no Raspberry Pi 4 com o sistema de sensoriamento DHT11.

## Especificações do Módulo RM520N-GL

### Características Técnicas
- **Modelo**: Quectel RM520N-GL
- **Tecnologia**: 5G NR Sub-6, LTE Cat 20, 3GPP Rel. 15
- **Interface**: USB 3.1, PCIe
- **Formato**: M.2 (Key B)
- **GNSS**: Suporte integrado
- **Temperatura de operação**: -40°C a +85°C

### Conectividade
- **5G NR**: Sub-6 GHz
- **LTE**: Cat 20 (DL: 2Gbps, UL: 150Mbps)
- **3G**: WCDMA/HSPA+
- **2G**: GSM/GPRS/EDGE

## Configuração do Hardware

### Conexões Físicas
```
RM520N-GL → Raspberry Pi 4
├── M.2 Slot → HAT M.2 Adapter
├── USB 3.0 → Interface USB
├── Antena Principal → Antena 5G
├── Antena Diversidade → Antena LTE
└── SIM Card → Slot SIM
```

### Pino 11 (GPIO17) - Comunicação de Dados
O pino 11 do Raspberry Pi corresponde ao GPIO17 e é usado para comunicação de dados do sensor DHT11:

```
DHT11 → Pino 11 (GPIO17)
├── VCC → 3.3V
├── GND → GND
└── DATA → GPIO17
```

## Instalação e Configuração

### 1. Pré-requisitos
```bash
# Atualizar sistema
sudo apt update && sudo apt full-upgrade -y

# Instalar dependências
sudo apt install -y modemmanager network-manager python3-requests python3-rpi.gpio

# Habilitar serviços
sudo systemctl enable --now ModemManager NetworkManager
```

### 2. Configuração do Módulo RM520N-GL
```bash
# Executar configuração automática
python3 configure_rm520n.py

# Ou configuração manual:
# Detectar modem
mmcli -L

# Configurar APN (exemplo: Claro)
sudo mmcli -m 0 --simple-connect="apn=claro.com.br"

# Verificar interface de rede
ip link show
```

### 3. Teste do Pino 11
```bash
# Teste básico do pino 11
python3 test_pin11_rm520n.py

# Teste com DHT11 conectado ao pino 11
python3 test_pin11_dht11.py
```

## Scripts de Teste

### 1. `configure_rm520n.py`
Configuração completa do módulo RM520N-GL:
- Verificação de requisitos do sistema
- Detecção do modem
- Configuração de APN
- Teste de conectividade
- Configuração persistente

### 2. `test_pin11_rm520n.py`
Teste de validação do pino 11 e módulo RM520N-GL:
- Configuração GPIO do pino 11
- Teste de comunicação
- Verificação do módulo RM520N-GL
- Teste de conectividade 5G
- Envio de dados de teste

### 3. `test_pin11_dht11.py`
Teste específico do DHT11 no pino 11:
- Configuração GPIO17
- Leitura do sensor DHT11
- Teste de comunicação
- Envio contínuo de dados

## Configuração de APN por Operadora

### Claro
```bash
sudo mmcli -m 0 --simple-connect="apn=claro.com.br"
```

### Vivo
```bash
sudo mmcli -m 0 --simple-connect="apn=vivo"
```

### TIM
```bash
sudo mmcli -m 0 --simple-connect="apn=timbrasil.br"
```

### Oi
```bash
sudo mmcli -m 0 --simple-connect="apn=gprs.oi.com.br"
```

## Configuração Persistente

### NetworkManager (Recomendado)
```bash
# Criar conexão persistente
sudo nmcli con add type gsm ifname '*' con-name rm520n-5g apn claro.com.br

# Ativar conexão
sudo nmcli con up rm520n-5g

# Verificar status
nmcli con show rm520n-5g
```

### ModemManager
```bash
# Configurar conexão automática
sudo mmcli -m 0 --simple-connect="apn=claro.com.br"
```

## Monitoramento e Diagnóstico

### Verificar Status do Módulo
```bash
# Status do modem
mmcli -m 0

# Informações detalhadas
mmcli -m 0 --details

# Status da conexão
mmcli -m 0 --status
```

### Verificar Interface de Rede
```bash
# Listar interfaces
ip link show

# Verificar IP
ip addr show usb0

# Testar conectividade
ping -c 3 8.8.8.8
```

### Logs do Sistema
```bash
# Logs do ModemManager
journalctl -u ModemManager -f

# Logs do NetworkManager
journalctl -u NetworkManager -f
```

## Troubleshooting

### Problemas Comuns

#### 1. Módulo não detectado
```bash
# Verificar conexão USB
lsusb | grep -i quectel

# Verificar drivers
lsmod | grep cdc_mbim

# Recarregar módulos
sudo modprobe -r cdc_mbim
sudo modprobe cdc_mbim
```

#### 2. Sem conectividade
```bash
# Verificar APN
mmcli -m 0 --status

# Reiniciar conexão
sudo mmcli -m 0 --simple-disconnect
sudo mmcli -m 0 --simple-connect="apn=claro.com.br"

# Verificar interface
ip link show usb0
```

#### 3. Pino 11 não funciona
```bash
# Verificar GPIO
ls /sys/class/gpio/

# Testar GPIO17
echo 17 > /sys/class/gpio/export
echo in > /sys/class/gpio/gpio17/direction
cat /sys/class/gpio/gpio17/value
echo 17 > /sys/class/gpio/unexport
```

### Comandos de Diagnóstico
```bash
# Informações do sistema
uname -a
cat /proc/cpuinfo | grep Model

# Informações de rede
ip route show
ip addr show

# Informações do modem
mmcli -L
mmcli -m 0 --details
```

## Integração com o Sistema

### Envio de Dados via 5G
O sistema está configurado para enviar dados do DHT11 via módulo RM520N-GL:

```python
# Exemplo de payload
{
    "device_id": "PiCarX-RM520N-5G",
    "timestamp": 1640995200,
    "sensor": "DHT11",
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
        "apn": "claro.com.br"
    }
}
```

### Dashboard
O dashboard mostra informações específicas do módulo RM520N-GL:
- Tipo de módulo
- Tipo de conexão (5G)
- GPIO pin utilizado
- Status da conexão

## Manutenção

### Atualização de Firmware
```bash
# Verificar versão atual
mmcli -m 0 --details | grep -i firmware

# Atualizar firmware (se necessário)
# Consulte documentação da Quectel para procedimento específico
```

### Limpeza de Logs
```bash
# Limpar logs antigos
sudo journalctl --vacuum-time=7d

# Limpar logs do ModemManager
sudo journalctl -u ModemManager --vacuum-time=3d
```

## Suporte

Para problemas específicos do módulo RM520N-GL:
- Consulte a documentação oficial da Quectel
- Verifique os logs do sistema
- Execute os scripts de diagnóstico incluídos

## Changelog

### v1.0.0
- Configuração inicial do módulo RM520N-GL
- Suporte ao pino 11 (GPIO17)
- Scripts de teste e configuração
- Integração com sistema de sensoriamento
