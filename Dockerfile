FROM node:20-bookworm-slim

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY backend ./
COPY docs ./docs

RUN mkdir -p uploads/avatars uploads/categories uploads/brands \
  && chown -R node:node /app

ENV NODE_ENV=production

USER node

EXPOSE 8080

CMD ["node", "server.js"]
