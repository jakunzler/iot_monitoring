# PiCarX — Quectel RM520N-GL, ModemManager e dados 5G (roteiro completo)

Este documento descreve, de forma **reproduzível**, como levantar dados IP na interface **`wwan0`** no Raspberry Pi (PiCarX) com módulo **Quectel RM520N-GL**, ligado a um core **5G** (ex.: **Open5GS**), e explica o **papel do ModemManager**. Foi validado com Debian **Bookworm**, kernel Raspberry Pi **6.12**, e sessão bearer com IPv4 na faixa **`10.45.0.0/…`** (DNN/APN `internet` no laboratório).

---

## 1. Conceitos rápidos

### 1.1 O que é o ModemManager (MM)

O **ModemManager** é um serviço em D-Bus que:

- Deteta o modem USB (ex.: Quectel RM520N).
- Fala com o modem por **QMI** (`/dev/cdc-wdm0`) através do **`qmi-proxy`** (processo auxiliar que multiplexa clientes QMI).
- Cria **bearers** (sessões de dados) com **APN**, obtém do core o **IPv4**, **máscara/prefixo**, **gateway**, **DNS**, **MTU**.
- Deveria **aplicar** esse IPv4 na interface de rede do kernel (tipicamente **`wwan0`** em modo **QMI + `qmi_wwan`**).

Em muitos setups (incluindo este PiCarX), o MM **consegue** estabelecer a sessão e o **`mmcli -b 0`** mostra o IPv4 correto, mas **não aplica** o endereço na `wwan0`. Nesse caso o utilizador repete manualmente na interface os mesmos valores que o bearer já conhece — ver secção [7](#7-quando-o-ipv4-não-aparece-em-wwan0-mas-o-bearer-está-cert).

### 1.2 O que não é o ModemManager

- **Não substitui** a configuração do **Open5GS** (SMF/UPF, pools de UE, DNN).
- **Não garante** sozinho rotas perfeitas se houver **NetworkManager** a disputar a `wwan0`, ou se a ordem **link up / RTNL** falhar.

### 1.3 Interface `wwan0` e modo raw IP

Com o driver **`qmi_wwan`**, o tráfego de dados móveis costuma ser **raw IP**. O parâmetro **`/sys/class/net/wwan0/qmi/raw_ip`** deve estar **`Y`** quando a stack QMI assim o exige; o **ModemManager** em geral trata disso ao gerir a sessão. Se algo estiver incoerente, ver `cat /sys/class/net/wwan0/qmi/raw_ip`.

---

## 2. Pré-requisitos no PiCarX

| Requisito | Notas |
|-----------|--------|
| Módulo RM520N reconhecido | `lsusb` → `2c7c:0801` Quectel RM520N-GL |
| Dispositivo QMI | `/dev/cdc-wdm0` presente |
| Pacotes | `modemmanager`, `libqmi-utils` (e opcionalmente `minicom` para AT) |
| Utilizador | Acesso `sudo`; convém `pi` no grupo **`dialout`** para portas série (`sudo usermod -aG dialout pi`) |
| Core | APN/DNN acordados (ex.: **`internet`**) e pool de UE coerente (ex.: **10.45.0.0/…**) |

---

## 3. Instalação e arranque do ModemManager

```bash
sudo apt update
sudo apt install modemmanager libqmi-utils
sudo systemctl enable --now ModemManager
```

Verificar:

```bash
sudo systemctl status ModemManager --no-pager
```

Esperado: **`active (running)`** e processo **`/usr/libexec/qmi-proxy`** (em instalações Debian típicas).

**Nota:** Após `apt install`, se o serviço não arrancar, usar explicitamente `sudo systemctl start ModemManager`.

---

## 4. Roteiro principal — ligar dados (APN)

### 4.1 Listar modem

Aguardar alguns segundos após arranque ou `reboot` (o probe pode demorar **10–30 s**).

```bash
sudo mmcli -L
```

Saída esperada (exemplo):

```text
/org/freedesktop/ModemManager1/Modem/0 [Quectel] RM520N-GL
```

Se aparecer **“No modems were found”**:

1. Não reiniciar o ModemManager em loop com intervalos curtos; esperar **15–30 s** e repetir.
2. Opcional: `sudo mmcli --scan-modems` e voltar a `mmcli -L`.
3. Ver `journalctl -u ModemManager -b --no-pager | tail -50`.

### 4.2 Pedir ligação de dados (PDP / bearer)

Substituir `internet` pelo APN real do teu core, se diferente:

```bash
sudo mmcli -m 0 --simple-connect="apn=internet"
```

Esperado: mensagem de sucesso e estado **`connected`** em:

```bash
sudo mmcli -m 0
```

### 4.3 Inspecionar o bearer (IPv4 atribuído pelo core)

```bash
sudo mmcli -b 0
```

Procurar a secção **IPv4 configuration**, por exemplo:

- **address:** `10.45.0.10`
- **prefix:** `30` (equivale a **/30**)
- **gateway:** `10.45.0.9`
- **dns**, **mtu**

Estes valores vêm da **sessão de dados**; são a **referência** para configurar a `wwan0` manualmente se o kernel não os tiver.

### 4.4 Ativar a interface no kernel

```bash
sudo ip link set wwan0 up
ip -4 addr show dev wwan0
```

- Se **já aparecer** o IPv4 correto em `wwan0`, passar à secção [5](#5-rotas-e-testes-de-conectividade).
- Se **não aparecer** IPv4 público em `wwan0` mas o `mmcli -b 0` estiver preenchido, seguir [secção 7](#7-quando-o-ipv4-não-aparece-em-wwan0-mas-o-bearer-está-cert).

---

## 5. Rotas e testes de conectividade

### 5.1 Rota por defeito pela `wwan0` (métrica)

No Linux, em empate de rotas **default**, vence a de **métrica numérica mais baixa**.

| Interface típica (DHCP) | Métrica vulgar |
|-------------------------|----------------|
| `eth0`                    | **100**        |
| `wlan0`                   | **600**        |
| `wwan0` (5G prioritário) | **50** (defeito em `wwan-quectel.default`) |
| `wwan0` (5G só em testes no portátil, LAN preferida para “internet”) | **1050** |

No **PiCarX** o objectivo costuma ser **5G primeiro** → `METRIC=50` em `/etc/default/wwan-quectel` (inferior a 100).

Exemplo manual (ajusta **gateway** ao `mmcli -b 0`):

```bash
sudo ip route replace default via 10.45.0.9 dev wwan0 metric 50
```

Rotas **ligadas** à sub-rede local (`172.16.0.0/23` no `eth0`, etc.) continuam a ser usadas para esses destinos; só o **default** para o resto segue a métrica mais baixa (a `wwan0` com 50).

Para **inverter** temporariamente (laboratório): usar métrica **1050** na `wwan0` ou **subir** a métrica do `eth0`.

### 5.2 Testes

```bash
ip -4 addr show dev wwan0
ip route
ping -I wwan0 -c 3 8.8.8.8
```

- **Sucesso típico:** respostas ICMP com RTT estável.
- **Ping ao gateway (`10.45.0.9`)** pode **falhar** mesmo com Internet OK — muitos UPFs/nós internos **não respondem a ICMP**; mensagens **ICMP Redirect** de outro hop (ex.: `10.45.0.1`) podem aparecer. O teste decisivo costuma ser **tráfego para fora** (ex.: `8.8.8.8`).

### 5.3 DNS

Se `ping 8.8.8.8` funcionar mas **nomes** não resolverem, usar os DNS do bearer (`mmcli -b 0`) em **systemd-resolved** ou `/etc/resolv.conf`, conforme a tua configuração Debian.

### 5.4 Confirmar que o tráfego “para a Internet” usa a `wwan0`

Depois de configurar métricas (`METRIC=50` na rota default da `wwan0`), verifica o que o kernel **escolhe** para um destino externo:

```bash
ip route get 8.8.8.8
```

Esperado (ajusta IPs ao teu UE/prefixo): origem **`10.45.0.x`** e saída por **`wwan0`**.

Teste **sem** forçar interface (usa a rota preferida):

```bash
ping -c 2 8.8.8.8
```

Se o default continuar a sair pelo **`eth0`**, vê `ip r`: a `wwan0` deve ter métrica **inferior** à do `default` do `eth0` (ex.: **50** frente a **100**). Actualiza `/etc/default/wwan-quectel` (`METRIC=50`) e `sudo systemctl restart wwan-quectel.service`.

### 5.5 Rastrear pacotes na `wwan0` (`tcpdump`)

Para **ver pacotes** a passar na interface móvel (diagnóstico, não só “há ligação”):

```bash
sudo apt install tcpdump    # uma vez
sudo tcpdump -i wwan0 -n
```

Exemplos úteis:

```bash
sudo tcpdump -i wwan0 -n icmp                    # só ICMP (ex. pings)
sudo tcpdump -i wwan0 -nn 'tcp port 443'         # HTTPS
sudo tcpdump -i wwan0 -w /tmp/captura.pcap       # gravar para Wireshark
```

**Contadores** por interface (totais, sem listar cada pacote):

```bash
ip -s link show wwan0
```

Ligações TCP estabelecidas (não é captura de tráfego):

```bash
ss -tnp
```

---

## 6. Conflito com o NetworkManager (opcional mas útil)

Se o **NetworkManager** estiver a tratar da `wwan0`, o ModemManager pode **não aplicar** endereços.

Verificar:

```bash
nmcli device status
```

Se `wwan0` estiver **managed**, experimental:

```bash
sudo nmcli device set wwan0 managed no
```

Depois **desligar e voltar a ligar** a sessão:

```bash
sudo mmcli -m 0 --simple-disconnect
sudo mmcli -m 0 --simple-connect="apn=internet"
```

---

## 7. Quando o IPv4 **não** aparece em `wwan0` mas o bearer está certo

Sintoma: `sudo mmcli -b 0` mostra **address / prefix / gateway**, mas `ip a` na `wwan0` **não** tem `inet` IPv4 (só **fe80::** ou nada).

**Correção manual alinhada ao bearer** (exemplo com prefix **30** = máscara **/30**):

```bash
sudo mmcli -m 0 --simple-disconnect   # opcional: limpar sessão anterior
sudo mmcli -m 0 --simple-connect="apn=internet"
# Ler no mmcli -b 0: ADDRESS, PREFIX, GATEWAY
sudo ip addr flush dev wwan0
sudo ip addr add 10.45.0.10/30 dev wwan0    # usar address/prefix REAIS do bearer
sudo ip link set wwan0 up
sudo ip route replace default via 10.45.0.9 dev wwan0 metric 50   # gateway do bearer; 50 = prioridade sobre eth 100
```

Validar com `ping -I wwan0 …` como na secção 5.

**Papel do MM aqui:** o MM **negociou** a sessão e **sabe** o IPv4; aplicação na interface falhou no Pi — por isso o roteiro **repete** no kernel o que o bearer já reporta.

---

## 8. Desligar dados (manutenção)

```bash
sudo mmcli -m 0 --simple-disconnect
sudo ip addr flush dev wwan0
sudo ip link set wwan0 down
```

Opcional: remover rota default da `wwan0` se tiver sido adicionada à mão.

---

## 9. Diagnóstico rápido (tabela)

| Sintoma | Verificar |
|---------|-----------|
| `mmcli -L` vazio | Esperar mais tempo; `mmcli --scan-modems`; `journalctl -u ModemManager`; **não** reiniciar MM em loop com intervalos muito curtos |
| Bearer sem IPv4 | Core (SMF/UPF), APN, SIM |
| Bearer com IPv4, `wwan0` sem `inet` | Secção [7](#7-quando-o-ipv4-não-aparece-em-wwan0-mas-o-bearer-está-cert); possivelmente **NM** a gerir `wwan0` |
| Após reboot, IP estranho na `wwan0` (ex. faixa antiga) ou ping 100% loss com IP “certo” à mão | Fazer **`simple-connect` primeiro** (sessão PDU); usar **`wwan-quectel.service`** — secção [11](#11-persistência-após-reboot-recomendado-wwan-quectelservice) |
| Internet sai pelo `eth0` apesar 5G OK | **Métricas**: `wwan0` precisa de métrica **menor** que o default do `eth0` — `METRIC=50` em `/etc/default/wwan-quectel`; `ip route get 8.8.8.8` |
| `ping 8.8.8.8` falha | Rotas (`ip r`); métricas; firewall; ver também linha acima |
| Gateway não responde ping | Normal; testar **8.8.8.8** na mesma |

---

## 10. Ferramenta de relatório no repositório

Para comparar **dois hosts** (ex.: Ubuntu no portátil vs PiCarX):

```bash
bash scripts/picarx/modem_snapshot.sh | tee snapshot-$(hostname).txt
```

Útil para alinhar **firmware**, **usbnet**, **ModemManager** e estado **QMI**.

---

## 11. Persistência após reboot (recomendado: `wwan-quectel.service`)

### Porque após reiniciar “deixa de funcionar”

1. **Rota e endereço em memória não sobrevivem** ao reboot (excepto se gravados noutro sítio).
2. É **obrigatório** voltar a ter uma **sessão de dados activa no modem** (`simple-connect` / PDU). Se colocares **só** `10.45.0.10/30` na `wwan0` **sem** o ModemManager (e o core) terem restabelecido a sessão QMI, o ping para **8.8.8.8** pode falhar com **100% packet loss** — tens IP no Linux mas **não há tráfego no canal de dados**.
3. Podem ficar **endereços antigos** na `wwan0` (ex.: `200.137.220.59/24`) vindos de **sessões anteriores** ou de outro caminho; por isso o script faz **flush** antes de ligar de novo.

### Instalação no PiCarX (a partir deste repositório)

No próprio Pi (ou com caminhos ajustados):

```bash
sudo install -m 755 scripts/picarx/wwan-connect.sh /usr/local/sbin/wwan-connect.sh
sudo install -m 644 scripts/picarx/wwan-quectel.default /etc/default/wwan-quectel
sudo install -m 644 scripts/picarx/systemd/wwan-quectel.service /etc/systemd/system/wwan-quectel.service
sudo nano /etc/default/wwan-quectel    # APN; METRIC=50 (5G prioritário); opcional SET_NM_WWAN_UNMANAGED=1
sudo systemctl daemon-reload
sudo systemctl enable --now wwan-quectel.service
```

Ver estado e logs:

```bash
systemctl status wwan-quectel.service --no-pager
journalctl -u wwan-quectel.service -b --no-pager
ip -4 addr show dev wwan0
ping -I wwan0 -c 3 8.8.8.8
```

### O que o serviço faz

1. Opcionalmente marca **`wwan0`** como **não gerida** pelo NetworkManager (`SET_NM_WWAN_UNMANAGED=1`).
2. Espera o **`mmcli -L`** listar um modem.
3. **`ip addr flush`** na `wwan0` e remove a rota default por `wwan0`.
4. **`mmcli -m 0 --simple-disconnect`** (limpa sessão anterior) e **`--simple-connect`** com o **APN** do ficheiro.
5. Lê **`mmcli -b 0`** até existir **connected: yes** e **address / prefix / gateway**.
6. Aplica **`ip addr add`** e **`ip route replace default`** com a **métrica** de `/etc/default/wwan-quectel` — por defeito no repositório **`METRIC=50`** para a rota 5G ser **preferida** face ao `eth0` (~100) e `wlan0` (~600). Valores **maiores** (ex. **1050**) fazem o contrário (útil no portátil se quiseres LAN como default).

Assim, **cada boot** o fluxo repete: **ModemManager → sessão PDU activa → kernel**, evitando configurar só IP estático **sem** sessão no modem (caso em que `ping 8.8.8.8` pode dar **100% loss**).

Após actualizar o repositório, reinstala o script e confere **`METRIC`** no Pi:

```bash
grep ^METRIC /etc/default/wwan-quectel
sudo systemctl restart wwan-quectel.service
```

### Correcção manual se o serviço falhar

```bash
sudo systemctl status wwan-quectel.service
sudo journalctl -u wwan-quectel -b --no-pager
sudo mmcli -m 0
sudo mmcli -b 0
```

### Outras opções (menos automáticas)

- Corrigir o ModemManager / NM para **aplicar sozinho** o IPv4 na `wwan0` (sem script).
- Manter apenas comandos manuais do roteiro principal (secções 4–7).

---

## 12. Referências no projeto

- Script de snapshot: `scripts/picarx/modem_snapshot.sh`
- Persistência **systemd**: `scripts/picarx/wwan-connect.sh`, `scripts/picarx/wwan-quectel.default`, `scripts/picarx/systemd/wwan-quectel.service`
- Script auxiliar DHCP/MBIM (cenário diferente, sem MM): `scripts/picarx/configure_rm520n_dhcp.sh`
- Documentação Quectel genérica: `docs/backend/configurar_modulo_quectel.md`, `docs/backend/RM520N-GL_README.md`

### Resumo do que foi consolidado recentemente

| Tópico | Onde está neste documento |
|--------|---------------------------|
| Rota **5G prioritária** (`METRIC=50` vs `eth0` 100) | [5.1](#51-rota-por-defeito-pela-wwan0-métrica), [5.4](#54-confirmar-que-o-tráfego-para-a-internet-usa-a-wwan0) |
| **Rastreio** de pacotes (`tcpdump`, `ip -s link`) | [5.5](#55-rastrear-pacotes-na-wwan0-tcpdump) |
| **Reboot**: PDU obrigatória; IP manual sem sessão = falha | [11](#11-persistência-após-reboot-recomendado-wwan-quectelservice) |
| Serviço **wwan-quectel** e flush de endereços antigos | [11](#11-persistência-após-reboot-recomendado-wwan-quectelservice) |

---

*Última actualização: PiCarX Debian Bookworm; ModemManager; `wwan-quectel.service`; métrica 50 para default pela `wwan0`; tcpdump para diagnóstico.*
