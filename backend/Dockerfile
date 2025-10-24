# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Ensure the build script in backend/package.json is "nest build"
RUN npm run build

# Run stage
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package*.json ./
COPY --from=build /app/dist ./dist
# If you need runtime migrations, add the CLI + compiled migration files as needed.
EXPOSE 4000
CMD ["node", "dist/main.js"]
