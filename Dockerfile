FROM node:20-bookworm-slim

WORKDIR /app

COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

COPY . .

RUN mkdir -p backend/uploads/avatars backend/uploads/categories backend/uploads/brands \
  && chown -R node:node /app

ENV NODE_ENV=production

USER node

EXPOSE 8080

CMD ["npm", "start", "--prefix", "backend"]
