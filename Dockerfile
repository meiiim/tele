FROM node:lts-buster

RUN apt-get update && \
  apt-get install -y && \
  apt-get upgrade -y && \
  rm -rf /var/lib/apt/lists/*

COPY package.json .

RUN npm install && npm install i -g pm2

COPY . .

EXPOSE 5000

CMD ["pm2-runtime", "index.js"]
