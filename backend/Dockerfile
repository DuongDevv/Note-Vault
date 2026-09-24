# ==========================================
# STAGE 1: BUILDER (Biên dịch TS & Argon2 C++)
# ==========================================
FROM node:20-slim AS builder

WORKDIR /app

# Cài đặt Python3, Make, G++ trên Debian cho node-gyp
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Cài đặt toàn bộ dependencies
RUN npm ci

# Copy toàn bộ source code
COPY . .

# Build TypeScript sang JavaScript
RUN npm run build

# ==========================================
# STAGE 2: RUNNER (Môi trường chạy Production)
# ==========================================
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

# Cài đặt Python3, Make, G++ cho Production Runtime
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Chỉ cài đặt production dependencies
RUN npm ci --only=production

# Copy thư mục dist từ STAGE 1
COPY --from=builder /app/dist ./dist

# Mở cổng 5000
EXPOSE 5000

# Chạy ứng dụng từ dist/server.js
CMD ["node", "dist/server.js"]
