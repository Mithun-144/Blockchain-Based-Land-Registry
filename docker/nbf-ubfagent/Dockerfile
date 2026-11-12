FROM docker:cli AS dockercli
FROM node:18-bookworm-slim

COPY --from=dockercli /usr/local/bin/docker /usr/local/bin/docker

WORKDIR /opt/ubfagent-deps
COPY fabric/ubfagent/package.json fabric/ubfagent/package-lock.json ./
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund

ENV NODE_PATH=/opt/ubfagent-deps/node_modules
WORKDIR /home/mithun/.servers/ubfagent
EXPOSE 3000
CMD ["node", "server.js"]
