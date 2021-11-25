FROM node:16.5.0-alpine

WORKDIR /
ADD src/ /src
ADD migrations/ /migrations
ADD database.json /
ADD package.json /
ADD tsconfig.json /
ADD docker/start.sh /
ADD logs /logs
ADD copy-static-assets.sh /copy-static-assets.sh
RUN apk update && apk add python3 make g++ bash openssl && rm -rf /var/cache/apk/* && npm install && npm run compile && npm run copy-static-assets

CMD ["sh", "start.sh"]
