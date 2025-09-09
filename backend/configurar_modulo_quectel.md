Perfeito, Jonas 👍. Se você ligar o **Quectel RM520N-GL** direto no seu **Asus Vivobook com Pop!\_OS**, dá pra configurar e testar a conexão 5G antes de integrar ao PiCarX. Vou te passar o passo a passo pensando no seu ambiente (Linux Pop!\_OS):

---

## 🔌 1. Conectar e verificar se o sistema reconhece

Pluge o RM520N-GL via USB no notebook.

Rode:

```bash
lsusb
```

Você deve ver algo como:

```
2c7c:0800 Quectel Wireless Solutions Co., Ltd. RM520N-GL
```

Verifique as portas seriais:

```bash
ls /dev/ttyUSB*
```

O módulo geralmente cria várias (`ttyUSB0` … `ttyUSB4`).
→ Uma delas é o canal **AT** (comandos de modem).

---

## 🖥️ 2. Testar comunicação AT

Instale utilitários:

```bash
sudo apt update
sudo apt install minicom
```

Abra o canal AT (exemplo em `/dev/ttyUSB2`):

```bash
minicom -D /dev/ttyUSB2 -b 115200
```

Digite:

```
AT
```

→ deve responder `OK`.

---

## 📶 3. Configurar APN da Vivo

No console AT:

```
AT+CPIN?
AT+CREG?
AT+CGATT?
AT+CGDCONT=1,"IP","zap.vivo.com.br"
```

A APN da Vivo é **zap.vivo.com.br**.

---

## 🌐 4. Modos de rede (USB)

O RM520N-GL pode expor interface de dados de várias formas:

* **ECM / RNDIS** (mais simples, aparece como placa de rede `usb0` ou `wwan0`)
* **QMI** (`/dev/cdc-wdm0`, gerenciado com `libqmi-utils`)
* **MBIM** (`/dev/cdc-wdm0`, gerenciado com `libmbim-utils`)

Checar modo atual:

```
AT+QCFG="usbnet"
```

Retornos possíveis:

* `0` = ECM
* `2` = RNDIS
* `3` = QMI
* `1` = MBIM

👉 Recomendo ECM ou RNDIS pra começar.

Se precisar mudar:

```
AT+QCFG="usbnet",0
AT+CFUN=1,1   // reinicia o modem
```

---

## 📡 5. Levantar a interface de rede

Depois de plugar de novo, rode:

```bash
ip a
```

Deve aparecer algo como `usb0` ou `wwan0`.

Solicite IP:

```bash
sudo dhclient usb0
```

Teste navegação:

```bash
ping -c 4 8.8.8.8
ping -c 4 google.com
```

---

## 🔧 6. Caso precise de QMI/MBIM

Instale ferramentas:

```bash
sudo apt install libqmi-utils libmbim-utils
```

Ativar sessão QMI:

```bash
sudo qmicli -d /dev/cdc-wdm0 --device-open-proxy
sudo qmi-network /dev/cdc-wdm0 start
```

Ativar sessão MBIM:

```bash
sudo mbim-network /dev/cdc-wdm0 start
```

---

## 🛠️ Resumo

1. Confirmar se aparece no `lsusb` e `/dev/ttyUSB*`.
2. Entrar em uma das portas e rodar `AT` pra ver resposta.
3. Configurar APN da Vivo.
4. Checar `AT+QCFG="usbnet"`, ajustar para ECM (0).
5. Ver se aparece interface de rede (`usb0`), rodar `dhclient`, testar ping.

---

👉 Quer que eu prepare um **script Bash** que automatiza (detecta porta AT, configura APN, ajusta modo ECM e levanta rede) no seu Pop!\_OS? Assim você só roda um comando no notebook para subir o 5G.
