FROM node:12-buster-slim

WORKDIR /frontail
ADD . .
RUN yarn install --production

ENTRYPOINT ["/frontail/docker-entrypoint.sh"]
EXPOSE 9001
CMD ["--help"]
