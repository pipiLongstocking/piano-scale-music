#!/bin/bash

# Configuration
PID_FILE=".server.pid"
PORT_FILE=".server.port"
DEFAULT_PORT=8080

get_port() {
  if [ -n "$1" ]; then
    echo "$1"
  else
    echo "$DEFAULT_PORT"
  fi
}

start_server() {
  local port=$1
  if [ -f "$PID_FILE" ]; then
    local pid=$(cat "$PID_FILE")
    if ps -p "$pid" > /dev/null 2>&1; then
      local running_port=$(cat "$PORT_FILE" 2>/dev/null || echo "unknown")
      echo "Server is already running on PID $pid (port $running_port)."
      return 1
    fi
    rm -f "$PID_FILE" "$PORT_FILE"
  fi

  # Check if port is already in use
  if lsof -i:$port -t >/dev/null 2>&1; then
    echo "Error: Port $port is already in use by another process."
    return 1
  fi

  echo "Starting Hindustani Virtual Piano local server on http://localhost:$port..."
  
  # Start the web server in the background
  if command -v python3 &>/dev/null; then
    python3 -m http.server "$port" > .server.log 2>&1 &
  elif command -v python &>/dev/null; then
    python -m SimpleHTTPServer "$port" > .server.log 2>&1 &
  elif command -v npx &>/dev/null; then
    npx http-server -p "$port" > .server.log 2>&1 &
  else
    echo "Error: Neither Python nor Node.js (npx) was found. Cannot start server."
    return 1
  fi

  local server_pid=$!
  echo "$server_pid" > "$PID_FILE"
  echo "$port" > "$PORT_FILE"
  
  # Open the browser automatically in macOS or Linux
  if [[ "$OSTYPE" == "darwin"* ]]; then
    (sleep 1 && open "http://localhost:$port") &
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    (sleep 1 && xdg-open "http://localhost:$port") &
  fi

  echo "Server started successfully in background (PID: $server_pid)."
}

stop_server() {
  if [ -f "$PID_FILE" ]; then
    local pid=$(cat "$PID_FILE")
    local port=$(cat "$PORT_FILE" 2>/dev/null || echo "unknown")
    if ps -p "$pid" > /dev/null 2>&1; then
      echo "Stopping server running on PID $pid (port $port)..."
      kill "$pid"
      sleep 0.5
      # Check if still running, force kill if necessary
      if ps -p "$pid" > /dev/null 2>&1; then
        kill -9 "$pid"
      fi
      echo "Server stopped."
    else
      echo "Server was not running (stale PID file cleaned up)."
    fi
    rm -f "$PID_FILE" "$PORT_FILE"
  else
    echo "No server running (no $PID_FILE file found)."
  fi
}

status_server() {
  if [ -f "$PID_FILE" ]; then
    local pid=$(cat "$PID_FILE")
    local port=$(cat "$PORT_FILE" 2>/dev/null || echo "unknown")
    if ps -p "$pid" > /dev/null 2>&1; then
      echo "Server is running on PID $pid, serving http://localhost:$port"
    else
      echo "Server is not running (stale PID file found)."
    fi
  else
    echo "Server is stopped."
  fi
}

# Parse command line arguments
COMMAND="start"
PORT_ARG=""

if [ $# -gt 0 ]; then
  case "$1" in
    start|stop|restart|status)
      COMMAND="$1"
      shift
      if [ $# -gt 0 ]; then
        PORT_ARG="$1"
      fi
      ;;
    *)
      # If first argument is a number, assume it is a custom port and command is "start"
      if [[ "$1" =~ ^[0-9]+$ ]]; then
        PORT_ARG="$1"
      else
        echo "Usage: ./run.sh [start|stop|restart|status] [port]"
        exit 1
      fi
      ;;
  esac
fi

case "$COMMAND" in
  start)
    PORT=$(get_port "$PORT_ARG")
    start_server "$PORT"
    ;;
  stop)
    stop_server
    ;;
  restart)
    PORT=$(get_port "$PORT_ARG")
    # If restarting and no port argument was passed, reuse the current port
    if [ -f "$PORT_FILE" ] && [ -z "$PORT_ARG" ]; then
      PORT=$(cat "$PORT_FILE")
    fi
    stop_server
    sleep 0.5
    start_server "$PORT"
    ;;
  status)
    status_server
    ;;
esac
