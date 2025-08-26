FROM node:22-alpine3.21
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY ./src .
ENTRYPOINT [ "node", "--disable-wasm-trap-handler", "/app/app.js" ]
