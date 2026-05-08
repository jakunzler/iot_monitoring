# Configuração do Gunicorn para produção
# Arquivo: gunicorn.conf.py

import multiprocessing
import os

# Configurações básicas
bind = "0.0.0.0:8080"
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
worker_connections = 1000
timeout = 30
keepalive = 2

# Configurações de logging
accesslog = "/var/log/dht22-server/access.log"
errorlog = "/var/log/dht22-server/error.log"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"'

# Configurações de processo
max_requests = 1000
max_requests_jitter = 100
preload_app = True

# Configurações de segurança
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190

# Configurações de ambiente
raw_env = [
    'FLASK_ENV=production',
    'FLASK_RUN_HOST=0.0.0.0',
    'FLASK_RUN_PORT=8080',
]

# Configurações de usuário
user = "dht22"
group = "dht22"

# Configurações de PID
pidfile = "/var/run/dht22-server.pid"

# Configurações de SSL (descomente se usar HTTPS)
# keyfile = "/etc/ssl/private/dht22-server.key"
# certfile = "/etc/ssl/certs/dht22-server.crt"
