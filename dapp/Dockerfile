FROM node:22.18.0-alpine3.22

# Optimisations mémoire Node.js (options valides uniquement)
ENV NODE_OPTIONS="--max-old-space-size=3072 --wasm-max-mem-pages=49152 --wasm-max-committed-code-mb=3072"

WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY ./src .

# Supprimer --disable-wasm-trap-handler et utiliser les optimisations natives
ENTRYPOINT [ "node", "/app/app.js" ]
