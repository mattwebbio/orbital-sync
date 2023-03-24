FROM node:18-alpine as builder
ENV NODE_ENV=development

WORKDIR /usr/src/app
COPY . .
RUN yarn install && \
    yarn tsc

FROM node:18-alpine
ENV NODE_ENV=production

WORKDIR /usr/src/app
COPY package.json yarn.lock ./
RUN yarn install

COPY --from=builder /usr/src/app/dist ./dist

CMD [ "node", "dist/index.js" ]
