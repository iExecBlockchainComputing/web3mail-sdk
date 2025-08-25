FROM node:22.18.0-alpine3.22

# Optimisation mémoire Node.js (option valide uniquement)
ENV NODE_OPTIONS="--max-old-space-size=3072"

WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY ./src .

# Supprimer --disable-wasm-trap-handler et utiliser les optimisations natives
ENTRYPOINT [ "node", "/app/app.js" ]
