# alpine 3.22 causes errors Segmentation fault error. Using 3.21 instead.
FROM node:22-alpine3.22
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY ./src .
ENTRYPOINT [ "node", "--disable-wasm-trap-handler", "/app/app.js" ]
