#!/bin/bash

# Find an available port starting at 8080
PORT=8080
while lsof -i:$PORT -t >/dev/null 2>&1; do
  PORT=$((PORT+1))
done

echo "Starting Hindustani Virtual Piano local server on http://localhost:$PORT..."

# Open the browser automatically in macOS or Linux
if [[ "$OSTYPE" == "darwin"* ]]; then
  (sleep 1 && open "http://localhost:$PORT") &
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  (sleep 1 && xdg-open "http://localhost:$PORT") &
fi

# Run the server using python3, python, or npx
if command -v python3 &>/dev/null; then
  python3 -m http.server "$PORT"
elif command -v python &>/dev/null; then
  python -m SimpleHTTPServer "$PORT"
elif command -v npx &>/dev/null; then
  npx http-server -p "$PORT"
else
  echo "Error: Neither Python nor Node.js (npx) was found. Please install one of them to run the local server."
  exit 1
fi
