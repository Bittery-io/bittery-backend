FROM node:14.5.0-alpine

WORKDIR /
ADD src/ /src
ADD migrations/ /migrations
ADD database.json /
ADD package.json /
ADD tsconfig.json /
ADD docker/start.sh /
ADD logs /logs
RUN apk update && apk add python make g++ bash && rm -rf /var/cache/apk/* && npm install && npm run compile

CMD ["sh", "start.sh"]
