
FROM oven/bun:latest AS base
WORKDIR /app

COPY package.json ./

RUN bun install





FROM base AS dev
VOLUME [ "/app" ]
EXPOSE 3000 9229


CMD ["bun", "run", "--watch", "app.js"]


FROM base AS prod

COPY . .
EXPOSE 3000
CMD ["bun", "run", "app.js"]
