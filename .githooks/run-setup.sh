#!/usr/bin/env bash
# Lanza setup si la instalación cambió entre dos commits. Con --build, Docker reconstruye la imagen si cambió el Dockerfile.
# Uso: run-setup.sh ANTES DESPUES. Lo llaman post-merge, post-checkout y post-rewrite.
# Nunca hace fallar a git: si algo va mal, lo dice y sale con 0.

set -uo pipefail

before=${1:-}
after=${2:-HEAD}
setup="docker compose run --build --rm setup"

root=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
cd "$root" || exit 0

needs_setup() {
  [[ -d .agents/skills/delivery-workflow && -d .claude/skills/delivery-workflow ]] || return 0
  [[ -n "$before" && ! "$before" =~ ^0+$ ]] || return 0
  ! git diff --quiet "$before" "$after" -- apm.yml apm.lock.yaml desktop/pnpm-lock.yaml docs/storybook/pnpm-lock.yaml api-router/pnpm-lock.yaml Dockerfile docker/setup.sh 2>/dev/null
}

needs_setup || exit 0

if ! command -v docker >/dev/null 2>&1 || ! docker info >/dev/null 2>&1; then
  echo "aTempo: Docker no está en marcha. Lanza ${setup} cuando lo arranques."
  exit 0
fi

echo "aTempo: falta la instalación o cambió. Lanzando ${setup}."
$setup || echo "aTempo: la instalación falló. Vuelve a lanzar ${setup}."
exit 0
