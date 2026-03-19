#!/bin/bash

set -e  # Exit immediately on error

# === CONFIGURATION ===
REGISTRY="ghcr.io/mattwilson02"
IMAGE_NAME="leaselink-api"
COMPOSE_FILE="docker-compose.backend.yaml"
PORT_TO_WAIT=3333
JSON_SERVER_PORT=3000
MAX_RETRIES=30
RETRY_INTERVAL=2

# Check if platform is provided
PLATFORM=$1
if [ -z "$PLATFORM" ]; then
  echo "❌ Error: Platform not specified"
  echo "Usage: ./scripts/run-e2e-tests.sh [ios|android]"
  exit 1
fi

if [ "$PLATFORM" != "ios" ] && [ "$PLATFORM" != "android" ]; then
  echo "❌ Error: Invalid platform. Must be 'ios' or 'android'"
  echo "Usage: ./scripts/run-e2e-tests.sh [ios|android]"
  exit 1
fi

echo "🧪 Starting E2E test suite for $PLATFORM"
echo "========================================"

# Stop any existing backend
echo "🛑 Stopping backend if running..."
docker-compose -f "$COMPOSE_FILE" down 2>/dev/null || true

# Clean up postgres data to get a fresh database
echo "🧹 Cleaning up database for fresh seed..."
rm -rf ./data/postgres

echo "📦 Pulling latest image: $REGISTRY/$IMAGE_NAME:latest"
docker pull "$REGISTRY/$IMAGE_NAME:latest" 2>/dev/null || {
  echo "❌ Failed to pull image. Make sure you're logged into ghcr.io"
  echo "   Run: echo \$GITHUB_TOKEN | docker login ghcr.io -u mattwilson02 --password-stdin"
  exit 1
}

# Start backend with fresh database
echo "🚀 Starting backend services with fresh database..."
docker-compose -f "$COMPOSE_FILE" up -d

echo "⏳ Waiting for backend to become available at http://localhost:$PORT_TO_WAIT..."
retries=0
until curl --silent http://localhost:$PORT_TO_WAIT > /dev/null; do
  ((retries++))
  if [ $retries -ge $MAX_RETRIES ]; then
    echo "❌ Backend did not become available after $((MAX_RETRIES * RETRY_INTERVAL)) seconds."
    docker-compose -f "$COMPOSE_FILE" logs backend
    exit 1
  fi
  echo "⏳ Still waiting... ($retries/$MAX_RETRIES)"
  sleep $RETRY_INTERVAL
done

echo "⏳ Waiting for JSON server to become available at http://localhost:$JSON_SERVER_PORT..."
retries=0
until curl --silent http://localhost:$JSON_SERVER_PORT > /dev/null; do
  ((retries++))
  if [ $retries -ge $MAX_RETRIES ]; then
    echo "❌ JSON server did not become available after $((MAX_RETRIES * RETRY_INTERVAL)) seconds."
    docker-compose -f "$COMPOSE_FILE" logs backend
    exit 1
  fi
  echo "⏳ Still waiting for JSON server... ($retries/$MAX_RETRIES)"
  sleep $RETRY_INTERVAL
done

echo "✅ Backend is ready at: http://localhost:$PORT_TO_WAIT"
echo "✅ JSON server is ready at: http://localhost:$JSON_SERVER_PORT"
echo "✅ Database has been freshly seeded"

# Setup adb reverse for Android
if [ "$PLATFORM" == "android" ]; then
  echo "📱 Setting up adb reverse for Android..."
  adb reverse tcp:3333 tcp:3333
  adb reverse tcp:3000 tcp:3000
fi

# Run E2E tests in sequence
echo ""
echo "🧪 Running E2E tests for $PLATFORM..."
echo "========================================"

TEST_DIR="src/__tests__/e2e/$PLATFORM"
PASSED_TESTS=()
FAILED_TESTS=()
test_count=0

# Find all yaml test files
for test_file in "$TEST_DIR"/*.yaml; do
  if [ -f "$test_file" ]; then
    test_name=$(basename "$test_file")
    ((test_count++))
    echo ""
    echo "▶️  Running test $test_count: $test_name"
    echo "----------------------------------------"

    if maestro test "$test_file"; then
      echo "✅ PASSED: $test_name"
      PASSED_TESTS+=("$test_name")
    else
      echo "❌ FAILED: $test_name"
      FAILED_TESTS+=("$test_name")
    fi
  fi
done

# Print summary
echo ""
echo "========================================"
echo "📊 Test Summary for $PLATFORM"
echo "========================================"
echo "Total: $test_count tests"
echo "✅ Passed: ${#PASSED_TESTS[@]}"
echo "❌ Failed: ${#FAILED_TESTS[@]}"

if [ ${#PASSED_TESTS[@]} -gt 0 ]; then
  echo ""
  echo "Passed tests:"
  for test in "${PASSED_TESTS[@]}"; do
    echo "  ✅ $test"
  done
fi

if [ ${#FAILED_TESTS[@]} -gt 0 ]; then
  echo ""
  echo "Failed tests:"
  for test in "${FAILED_TESTS[@]}"; do
    echo "  ❌ $test"
  done
  echo ""
  echo "ℹ️  Backend is still running on http://localhost:3333"
  echo "ℹ️  To stop it, run: npm run backend:stop"
  exit 1
fi

echo ""
echo "🎉 All E2E tests passed!"
echo ""
echo "ℹ️  Backend is still running on http://localhost:3333"
echo "ℹ️  To stop it, run: npm run backend:stop"
