FROM node:24-alpine

ENV NODE_ENV=production
WORKDIR /app

# Patch OS packages (openssl, musl, zlib)
RUN apk update && apk upgrade --no-cache

# Install only production dependencies, then remove bundled npm/npx so Trivy doesn't flag npm's internal packages
COPY package*.json ./
RUN npm ci --omit=dev \
  && npm cache clean --force \
  && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx /usr/local/lib/node_modules/corepack /usr/local/bin/corepack

# Application code
COPY src ./src
COPY public ./public
COPY database ./database

# Run as the unprivileged "node" user that ships with the image
RUN chown -R node:node /app
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/server.js"]
