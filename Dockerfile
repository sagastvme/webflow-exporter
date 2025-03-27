

FROM node:latest AS dev
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
CMD ["npx", "nodemon", "--inspect=0.0.0.0", "--legacy-watch", "--ignore", "tmp_dir_for_websites/", "app.js"]

FROM oven/bun:latest AS prod
WORKDIR /app
COPY package.json ./
RUN bun install
COPY . .
CMD ["bun", "run", "app.js"]
