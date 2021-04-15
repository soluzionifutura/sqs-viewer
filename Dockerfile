FROM node:15.14.0-alpine3.11

WORKDIR /home/node/app

COPY . /home/node/app

RUN npm install

CMD npm start
