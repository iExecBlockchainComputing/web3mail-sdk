FROM node:22.18.0-alpine3.22

# Optimisations mémoire Node.js
ENV NODE_OPTIONS="--max-old-space-size=3072 --max-semi-space-size=256 --max-executable-size=256 --wasm-memory-size-limit=3072 --wasm-memory-pool-size=3072"

WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY ./src .

# Supprimer --disable-wasm-trap-handler et utiliser les optimisations natives
ENTRYPOINT [ "node", "/app/app.js" ]
