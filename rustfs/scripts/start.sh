#!/usr/bin/env bash
# Arranca el binario de RustFS instalado en el ordenador (camino ZIP).
# No usa Docker. Carga rustfs/.env si existe.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

DATA="${RUSTFS_DATA:-$ROOT/data}"
ADDRESS="${RUSTFS_ADDRESS:-127.0.0.1:9000}"
CONSOLE_ADDRESS="${RUSTFS_CONSOLE_ADDRESS:-127.0.0.1:9001}"
ACCESS_KEY="${RUSTFS_ACCESS_KEY:-atempo}"
SECRET_KEY="${RUSTFS_SECRET_KEY:-atempoatempo}"

if [[ -n "${RUSTFS_BIN:-}" ]]; then
  BIN="$RUSTFS_BIN"
elif [[ -x "$HOME/rustfs/bin/rustfs" ]]; then
  BIN="$HOME/rustfs/bin/rustfs"
elif command -v rustfs >/dev/null 2>&1; then
  BIN="$(command -v rustfs)"
else
  echo "No encuentro el binario de RustFS." >&2
  echo "Instálalo con Homebrew o ZIP (ver README), o define RUSTFS_BIN en .env" >&2
  exit 1
fi

if [[ ! -x "$BIN" ]]; then
  echo "El binario no es ejecutable: $BIN" >&2
  exit 1
fi

mkdir -p "$DATA"

export RUSTFS_ACCESS_KEY="$ACCESS_KEY"
export RUSTFS_SECRET_KEY="$SECRET_KEY"

echo "RustFS API:     http://${ADDRESS}"
echo "RustFS consola: http://${CONSOLE_ADDRESS}"
echo "Datos:          $DATA"
echo "Para parar: Ctrl+C"
echo

exec "$BIN" server \
  --address "$ADDRESS" \
  --console-enable \
  --console-address "$CONSOLE_ADDRESS" \
  "$DATA"
