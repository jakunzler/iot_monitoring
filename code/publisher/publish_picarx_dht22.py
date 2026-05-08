#!/usr/bin/env python3
import os, time, socket, requests, board, adafruit_dht

# === Configurações via variáveis de ambiente (ou valores padrão) ===
PUBLISH_URL = os.getenv("PUBLISH_URL", "http://127.0.0.1:8080/api/ingest")
DEVICE_ID = os.getenv("DEVICE_ID", "PiCarX-RM520N-DHT22")
READ_INTERVAL = float(os.getenv("READ_INTERVAL_S", "2.5"))  # segundos
REQUEST_TIMEOUT = int(os.getenv("REQUEST_TIMEOUT_S", "10"))

# === Pino do sensor ===
# Permitir troca do pino via env var (BCM). Padrão: 14 (pino físico 8)
def _resolve_board_pin_from_bcm(env_value: str):
    try:
        bcm = int(env_value)
    except Exception:
        return board.D14
    mapping = {
        14: board.D14,
        17: board.D17,
        4: board.D4,
        27: board.D27,
        22: board.D22,
    }
    return mapping.get(bcm, board.D14)


_bcm_str = os.getenv("DHT_GPIO_BCM", "14")
BOARD_PIN = _resolve_board_pin_from_bcm(_bcm_str)


def create_sensor():
    # No Raspberry, use_pulseio=False evita conflitos com libgpiod
    return adafruit_dht.DHT22(BOARD_PIN, use_pulseio=False)


def get_ip_address(fallback="usb0"):
    """Tenta descobrir o IP do dispositivo para enviar no metadata."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 53))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return fallback


def publish_data(temp, hum, reading_n, uptime_s):
    """Monta payload compatível com o ESP32 e envia ao servidor."""
    payload = {
        "device_id": DEVICE_ID,
        "timestamp": int(time.time()),
        "sensor": "dht22",
        "reading_number": reading_n,
        "data": {
            "temperature": temp,
            "humidity": hum,
            "temperature_f": temp * 9.0 / 5.0 + 32.0
        },
        "metadata": {
            "wifi_rssi": None,
            "wifi_ip": get_ip_address(),
            "uptime_seconds": uptime_s
        }
    }
    try:
        r = requests.post(PUBLISH_URL, json=payload, timeout=REQUEST_TIMEOUT)
        ok = (200 <= r.status_code < 300)
        print(f"POST {r.status_code} -> {'OK' if ok else 'FAIL'} | Temp: {temp:.1f}°C, Hum: {hum:.1f}%")
        return ok
    except Exception as e:
        print(f"❌ Erro ao publicar: {e}")
        return False


def main():
    print("=== Publicador DHT22 (PiCarX + RM520N-GL) ===")
    print(f"Endpoint: {PUBLISH_URL}")
    print(f"DeviceID: {DEVICE_ID}")
    print(f"Sensor: DHT22 no BCM {_bcm_str} (ajuste com DHT_GPIO_BCM)")
    print("-------------------------------------------")

    reading_n = 0
    t0 = time.time()

    dht = None
    while dht is None:
        try:
            dht = create_sensor()
        except Exception as e:
            print(f"⚠️  Falha ao inicializar DHT22 ({e}), tentando novamente em 2s…")
            time.sleep(2)

    time.sleep(2)
    while True:
        try:
            t = dht.temperature
            h = dht.humidity
            reading_n += 1
            uptime_s = int(time.time() - t0)

            if (t is None) or (h is None):
                print(f"⚠️ [{reading_n}] Leitura nula, tentando novamente…")
            else:
                print(f"📊 [{reading_n}] Temp: {t:.1f}°C  RH: {h:.1f}%")
                publish_data(t, h, reading_n, uptime_s)

        except RuntimeError as e:
            print(f"⚠️ [{reading_n}] {e.args[0]}")
        except Exception as e:
            print(f"❌ Erro grave: {e}. Reinicializando sensor…")
            try:
                if dht is not None and hasattr(dht, "exit"):
                    dht.exit()
            except Exception:
                pass
            dht = None
            while dht is None:
                try:
                    dht = create_sensor()
                except Exception as e2:
                    print(f"⚠️  Falha ao recriar DHT22 ({e2}), tentando em 2s…")
                    time.sleep(2)

        time.sleep(READ_INTERVAL)


if __name__ == "__main__":
    main()
