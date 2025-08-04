# Base stage for both Next.js and Storybook builds (dev deps installed)
FROM node:20-bullseye AS base

WORKDIR /app

RUN apt-get update && apt-get install -y \
  libnss3 libatk-bridge2.0-0 libx11-xcb1 libxcomposite1 libxdamage1 \
  libxrandr2 libgbm1 libasound2 libpangocairo-1.0-0 libcups2 libdrm2 \
  libxshmfence1 libatspi2.0-0 wget ca-certificates && \
  rm -rf /var/lib/apt/lists/*

COPY package*.json ./

ENV NODE_ENV=development

RUN npm install

COPY . .

# --- Next.js build stage ---
FROM node:20-bullseye AS next-build

WORKDIR /app

COPY package*.json ./

ENV NODE_ENV=production

RUN npm ci --production

COPY . .

RUN npm run build

# Production image for Next.js
FROM node:20-alpine AS next-prod

WORKDIR /app

COPY --from=next-build /app ./

ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "start"]

# --- Storybook build stage ---
FROM base AS storybook

RUN npx playwright install --with-deps

EXPOSE 6006

CMD ["npm", "run", "storybook"]
