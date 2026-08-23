FROM node:22-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=dependencies /app/node_modules ./node_modules
COPY package*.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma
COPY generated ./generated
COPY src ./src
EXPOSE 5000
CMD ["node", "src/server.js"]
