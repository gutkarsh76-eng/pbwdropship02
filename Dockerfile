FROM node:22-slim AS base
RUN npm install -g pnpm@10.4.1

# Install dependencies
FROM base AS deps
WORKDIR /src
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches/
RUN pnpm install --frozen-lockfile

# Build the application
FROM base AS build
WORKDIR /src
COPY --from=deps /src/node_modules ./node_modules
COPY . .
RUN pnpm build

# Production image
FROM base AS production
WORKDIR /src
ENV NODE_ENV=production

# Copy built files
COPY --from=build /src/dist ./dist
COPY --from=build /src/node_modules ./node_modules
COPY --from=build /src/package.json ./package.json

EXPOSE 3001

CMD ["node", "dist/index.js"]
