FROM node:20 AS base
WORKDIR /app
COPY package.json ./
RUN npm install
RUN npm rebuild


FROM base AS dev
VOLUME [ "/app" ]
EXPOSE 3000 9229
CMD ["npx", "nodemon", "--inspect=0.0.0.0:9229", "--nolazy", "--ignore", "tmp_dir_for_websites/*", "app.js"]



FROM base AS prod
COPY . .
EXPOSE 3000
CMD ["node", "app.js"]