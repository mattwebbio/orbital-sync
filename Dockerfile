ARG BASE_IMAGE


FROM node:18-alpine as install
ENV NODE_ENV=production

WORKDIR /usr/src/app
COPY package.json yarn.lock ./
RUN yarn install --production


FROM ${BASE_IMAGE}
ENV NODE_ENV=production

WORKDIR /usr/src/app
COPY package.json ./
COPY dist/ dist/
COPY --from=install /usr/src/app/node_modules ./node_modules

ENV PATH=$PATH:/nodejs/bin
ENTRYPOINT [ "node" ]
CMD [ "dist/index.js" ]
