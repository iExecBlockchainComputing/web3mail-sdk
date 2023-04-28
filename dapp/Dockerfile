FROM node:16-alpine3.14
RUN mkdir /app && cd /app && npm install node-mailjet && npm install jszip  && npm install joi
COPY ./src /app
ENTRYPOINT [ "node", "/app/app.js"]