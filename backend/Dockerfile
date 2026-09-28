# ==========================================
# STAGE 1: BUILDER (Biên dịch TypeScript)
# ==========================================
FROM node:22-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Cài đặt toàn bộ dependencies
RUN npm install

# Copy toàn bộ source code
COPY . .

# Build TypeScript sang JavaScript
RUN npm run build

# ==========================================
# STAGE 2: RUNNER (Môi trường chạy Production)
# ==========================================
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy node_modules và build dist từ STAGE 1
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package*.json ./

# Mở cổng 5000
EXPOSE 5000

# Chạy ứng dụng từ dist/server.js
CMD ["node", "dist/server.js"]
