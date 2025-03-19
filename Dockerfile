# Base stage with Bun
FROM oven/bun:latest AS base
WORKDIR /app

# Copy package files first for caching
COPY package.json ./

# Install dependencies explicitly
RUN bun install --frozen-lockfile

# Development stage - Uses live reload
FROM base AS dev
WORKDIR /app
COPY . .  
VOLUME [ "/app" ]
EXPOSE 3000 9229
CMD ["bun", "run", "--watch", "app.js"]

# Production stage - Ensures node_modules exists
FROM base AS prod
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules 
COPY . .  
EXPOSE 3000
CMD ["bun", "run", "app.js"]
