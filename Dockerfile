FROM node:13-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN apk --no-cache add curl

RUN npm install

COPY . .

EXPOSE 2020

CMD [ "node", "app.js" ]