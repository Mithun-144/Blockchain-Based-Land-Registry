FROM node:18-bookworm-slim

WORKDIR /opt/samplerest-deps
COPY fabric/nbf-samplerest/package.json fabric/nbf-samplerest/package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund

ENV NODE_PATH=/opt/samplerest-deps/node_modules
WORKDIR /app
EXPOSE 4000
CMD ["node", "./bin/www"]
