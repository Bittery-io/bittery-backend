FROM node:16.5.0-alpine

WORKDIR /
ADD src/ /src
ADD migrations/ /migrations
ADD database.json /
ADD package.json /
ADD tsconfig.json /
ADD docker/start.sh /
ADD logs /logs
RUN apk update && apk add python3 make g++ bash chromium && rm -rf /var/cache/apk/* && npm install

CMD ["sh", "start.sh"]
