# -------------------------------
# 1. Base dev stage (used by Storybook and Next.js dev)
# -------------------------------
FROM node:20-bullseye AS base

WORKDIR /app

COPY package*.json ./

ENV NODE_ENV=development

# Install all deps for dev
RUN npm install

# Install Playwright browsers with dependencies
RUN npx playwright install --with-deps

COPY . .

# -------------------------------
# 2. Next.js build stage
# -------------------------------
FROM node:20-bullseye AS next-build

WORKDIR /app

COPY package*.json ./

ENV NODE_ENV=production

RUN npm ci --production

COPY . .

RUN npm run build

# -------------------------------
# 3. Next.js production stage
# -------------------------------
FROM node:20-alpine AS next-prod

WORKDIR /app

COPY --from=next-build /app ./

ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "start"]

# -------------------------------
# 4. Storybook stage (no Playwright here)
# -------------------------------
FROM base AS storybook

EXPOSE 6006

CMD ["npm", "run", "storybook"]
