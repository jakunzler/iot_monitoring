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

# Estágio de produção com nginx
FROM nginx:alpine

# Copiar arquivos buildados
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuração customizada do nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Expor porta
EXPOSE 80

# Comando para iniciar nginx
CMD ["nginx", "-g", "daemon off;"]
