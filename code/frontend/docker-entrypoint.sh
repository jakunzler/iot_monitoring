#!/bin/sh
set -e
# Runtime upstream for nginx (HTTP to your VM is fine; browser only talks to Cloud Run over HTTPS).
DEFAULT_BACKEND="${DEFAULT_BACKEND_PROXY_URL:-http://200.137.220.50:8080}"
export BACKEND_PROXY_URL="${BACKEND_PROXY_URL:-$DEFAULT_BACKEND}"
sed "s|@BACKEND_PROXY@|${BACKEND_PROXY_URL}|g" /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf
exec nginx -g 'daemon off;'
