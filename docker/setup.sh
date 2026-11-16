#!/usr/bin/env bash
# Instala lo que el proyecto necesita, dentro del contenedor:
# el paquete de APM en la raíz y las dependencias de desktop/ y docs/storybook/ en sus volúmenes.
# Se lanza con docker compose run --rm setup.

set -euo pipefail

cd /work

echo "APM: instalando lo que fijan apm.yml y apm.lock.yaml."
apm install

for folder in desktop docs/storybook; do
  echo "pnpm: instalando ${folder}."
  pnpm --dir "$folder" install --frozen-lockfile
done

echo "Listo."
