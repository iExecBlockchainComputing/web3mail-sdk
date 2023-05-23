FROM node:14-alpine3.11
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY ./src .
ENTRYPOINT [ "node", "/app/app.js"]