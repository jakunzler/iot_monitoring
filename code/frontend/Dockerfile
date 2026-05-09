# Frontend Vite: precisa de devDependencies (vite) no stage de build.
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Incorporada no bundle em `npm run build` (ver src/config/env.js).
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# Estágio de produção com nginx (proxy /api → BACKEND_PROXY_URL em runtime)
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

COPY docker-entrypoint.sh /docker-entrypoint.sh
COPY nginx.conf.template /etc/nginx/nginx.conf.template
RUN chmod +x /docker-entrypoint.sh

ENV BACKEND_PROXY_URL=http://200.137.220.50:8080

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
