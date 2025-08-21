# -------------------------------
# 1. Base stage
# -------------------------------
FROM node:20-bullseye AS base

WORKDIR /app
COPY package*.json ./

ENV NODE_ENV=development

# Install dependencies fresh inside container
RUN npm install --legacy-peer-deps

# Install Playwright dependencies (optional)
RUN npx playwright install --with-deps

COPY . .

# -------------------------------
# 2. Next.js build stage
# -------------------------------
FROM node:20-bullseye AS next-build

WORKDIR /app
COPY package*.json ./

ENV NODE_ENV=production

RUN npm ci --omit=dev

COPY . .

RUN npm run build

# -------------------------------
# 3. Production stage
# -------------------------------
FROM node:20-alpine AS next-prod

WORKDIR /app

COPY --from=next-build /app ./

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "start"]

# -------------------------------
# 4. Storybook stage
# -------------------------------
FROM base AS storybook
EXPOSE 6006
CMD ["npm", "run", "storybook"]
