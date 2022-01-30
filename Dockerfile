FROM node:16-bullseye

# Create app directory
WORKDIR /usr/src/app

# Bundle app source
COPY . .

# Install deps
RUN npm install

# Build the frontend
RUN npm run build --workspace frontend

RUN rm -rf dist
RUN cp -r frontend/dist/ ./

# Build the server
RUN npm run compile --workspace server

RUN rm -rf frontend
RUN rm -rf node_modules
RUN rm -rf server/node_modules
RUN rm -rf server/src

FROM node:16-alpine

LABEL maintainer="banksio"

# Create app directory
WORKDIR /usr/src/app

COPY --from=0 /usr/src/app ./

RUN npm install --workspace server --only=prod

EXPOSE 3694
CMD [ "node", "server/build/src/index.js"]
