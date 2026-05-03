# Build from repository root:
#   docker build -f apps/gateway/Dockerfile -t castle-gateway .
# Run (env file or -e for secrets):
#   docker run --env-file apps/gateway/.env -p 8090:8090 castle-gateway

FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages ./packages
COPY apps ./apps

RUN npm ci --omit=dev

WORKDIR /app/apps/gateway
ENV NODE_ENV=production
EXPOSE 8090
CMD ["node", "src/server.js"]
