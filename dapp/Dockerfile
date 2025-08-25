FROM node:24.6.0-alpine3.22
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY ./src .
ENTRYPOINT [ "node", "/app/app.js" ]
