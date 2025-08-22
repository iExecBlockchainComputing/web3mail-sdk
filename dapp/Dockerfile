FROM node:20.11.1-alpine3.19
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY ./src .
ENTRYPOINT [ "node", "--disable-wasm-trap-handler", "/app/app.js" ]