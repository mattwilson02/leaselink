#!/bin/bash

set -e  # Exit immediately on error

# === CONFIGURATION ===
REGISTRY="ghcr.io/mattwilson02"
IMAGE_NAME="leaselink-api"
COMPOSE_FILE="docker-compose.backend.yaml"
PORT_TO_WAIT=3333
JSON_SERVER_PORT=3000
MAX_RETRIES=20
RETRY_INTERVAL=1

echo "🔐 Logging into GitHub Container Registry..."
echo "ℹ️  If not authenticated, run: echo \$GITHUB_TOKEN | docker login ghcr.io -u mattwilson02 --password-stdin"
docker pull "$REGISTRY/$IMAGE_NAME:latest" 2>/dev/null || {
  echo "❌ Failed to pull image. Make sure you're logged into ghcr.io"
  echo "   Run: echo \$GITHUB_TOKEN | docker login ghcr.io -u mattwilson02 --password-stdin"
  exit 1
}

echo "📦 Pulled latest image: $REGISTRY/$IMAGE_NAME:latest"

echo "🔁 Starting backend services using $COMPOSE_FILE"
docker-compose -f "$COMPOSE_FILE" up -d

echo "🌐 Waiting for backend to become available at http://localhost:$PORT_TO_WAIT..."
echo "🌐 Also waiting for JSON server to become available at http://localhost:$JSON_SERVER_PORT..."

retries=0
until curl --silent http://localhost:$PORT_TO_WAIT > /dev/null; do
  ((retries++))
  if [ $retries -ge $MAX_RETRIES ]; then
    echo "❌ Backend did not become available after $((MAX_RETRIES * RETRY_INTERVAL)) seconds."
    exit 1
  fi
  echo "⏳ Still waiting... ($retries/$MAX_RETRIES)"
  sleep $RETRY_INTERVAL
done

retries=0
until curl --silent http://localhost:$JSON_SERVER_PORT > /dev/null; do
  ((retries++))
  if [ $retries -ge $MAX_RETRIES ]; then
    echo "❌ JSON server did not become available after $((MAX_RETRIES * RETRY_INTERVAL)) seconds."
    exit 1
  fi
  echo "⏳ Still waiting for JSON server... ($retries/$MAX_RETRIES)"
  sleep $RETRY_INTERVAL
done

echo "✅ Backend is available at: http://localhost:$PORT_TO_WAIT"
echo "✅ JSON server is available at: http://localhost:$JSON_SERVER_PORT"
echo "📖 Opening API docs in your browser..."
npx open-cli http://localhost:3333/api/docs
npx open-cli http://localhost:3000
echo "🚀 Backend services are up and running!"