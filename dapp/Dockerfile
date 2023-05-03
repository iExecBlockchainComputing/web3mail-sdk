FROM node:14-alpine3.11
RUN mkdir /app && cd /app && npm install node-mailjet && npm install jszip  && npm install joi
COPY ./src /app
ENTRYPOINT [ "node", "/app/app.js"]