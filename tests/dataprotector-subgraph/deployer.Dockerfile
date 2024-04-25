FROM node:18.19

COPY . .

RUN npm ci

ENTRYPOINT [ "npm", "run", "all" ]