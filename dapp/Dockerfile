FROM node:20-alpine3.22
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY ./src .
ENTRYPOINT [ "node", "/app/app.js"]
