FROM node:20-alpine3.22

ENV NODE_OPTIONS="--disable-wasm-trap-handler"

WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY ./src .
ENTRYPOINT [ "node", "/app/app.js"]
