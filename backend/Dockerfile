# ==========================================
# STAGE 1: BUILDER (Biên dịch TS & Argon2)
# ==========================================
FROM oven/bun:1-slim AS builder

WORKDIR /app

# Cài đặt Python3, Make, G++ trên Debian cho node-gyp / argon2 compilation nếu cần
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy package và lockfile của Bun
COPY package.json bun.lock* ./

# Cài đặt toàn bộ dependencies bằng bun
RUN bun install --frozen-lockfile

# Copy toàn bộ source code
COPY . .

# Build TypeScript sang JavaScript
RUN bun run build

# ==========================================
# STAGE 2: RUNNER (Môi trường chạy Production)
# ==========================================
FROM oven/bun:1-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

# Cài đặt native build tools cho runtime native bindings
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy package và lockfile
COPY package.json bun.lock* ./

# Cài đặt production dependencies bằng bun
RUN bun install --production --frozen-lockfile

# Copy thư mục dist từ STAGE 1
COPY --from=builder /app/dist ./dist

# Mở cổng 5000
EXPOSE 5000

# Chạy ứng dụng bằng Bun runtime hoặc Node tương thích
CMD ["bun", "dist/server.js"]
