#!/usr/bin/env bash
# Instala lo que el proyecto necesita, dentro del contenedor:
# APM y dependencias Node en volúmenes; api-sqlite usa su venv Docker.
# Se lanza con docker compose run --rm setup.

set -euo pipefail

cd /work

echo "APM: instalando lo que fijan apm.yml y apm.lock.yaml."
apm install

for folder in ui desktop docs/storybook sdk api-router api-postgresql api-rustfs blockend postgres; do
  echo "pnpm: instalando ${folder}."
  pnpm --dir "$folder" install --frozen-lockfile
  if [[ "$folder" == sdk ]]; then
    echo "pnpm: compilando sdk."
    pnpm --dir sdk build
  fi
done

# Este venv vive en un volumen Linux y queda separado del entorno local de Windows/macOS.
python_venv=/work/api-sqlite/.venv
if [[ ! -x "${python_venv}/bin/python" ]]; then
  echo "Python: creando entorno virtual para api-sqlite."
  python3.13 -m venv "$python_venv"
fi
echo "Python: instalando api-sqlite desde pyproject.toml."
"${python_venv}/bin/python" -m pip install --disable-pip-version-check --no-cache-dir /work/api-sqlite


echo "Listo."
