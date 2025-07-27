FROM debian:12

WORKDIR /app

RUN DEBIAN_FRONTEND=noninteractive apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install --yes curl wget && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash && \
    DEBIAN_FRONTEND=noninteractive apt-get install --yes nodejs && \
    DEBIAN_FRONTEND=noninteractive apt-get install --yes wget build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev vim less iputils-ping sudo libsecret-1-0 command-not-found rsync man-db netcat-openbsd dnsutils procps lsof tini && \
    DEBIAN_FRONTEND=noninteractive apt-get update

RUN npm install -g pnpm vinxi
RUN pnpm set store-dir /app/node_modules/.pnpm-store

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Copy Prisma schema and source code before installing dependencies
COPY prisma/ ./prisma/
COPY src/ ./src/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy remaining application files
COPY . .

# Copy .env file for build-time environment variables
COPY .env .env

# Load environment variables from .env file and build the application
RUN export $(cat .env | tr -d '\r' | xargs) && pnpm run build

# Expose the port the app runs on
EXPOSE 3000

# Use tini as entrypoint for proper signal handling
ENTRYPOINT ["/usr/bin/tini", "--"]

# Default command (can be overridden in docker-compose)
CMD ["pnpm", "start"]
