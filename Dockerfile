FROM oven/bun:latest AS base
WORKDIR /app
COPY package.json ./
RUN bun install
COPY . .

FROM base AS dev
# Using Bun’s watch mode for development
CMD ["bun", "run", "--watch", "app.js"]

FROM base AS prod
CMD ["bun", "run", "app.js"]
