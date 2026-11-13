# Entorno de instalación de aTempo: Node, pnpm, git y APM con las mismas versiones para todo el equipo.
# Lo usan docker-compose.yml y .devcontainer/devcontainer.json.
FROM node:24-bookworm

# Electron 44 trae Node 24. pnpm sale de packageManager en desktop/ y docs/storybook/.
ARG PNPM_VERSION=10.33.0
ARG APM_VERSION=0.35.0

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3-venv \
  && rm -rf /var/lib/apt/lists/*

RUN npm install --global "pnpm@${PNPM_VERSION}" \
  && python3 -m venv /opt/apm \
  && /opt/apm/bin/pip install --no-cache-dir "apm-cli==${APM_VERSION}" \
  && ln -s /opt/apm/bin/apm /usr/local/bin/apm

# El repositorio llega montado desde otro ordenador: git no tiene que quejarse del dueño.
RUN git config --system --add safe.directory '*'

# Los node_modules de Linux viven en volúmenes, nunca en la carpeta del proyecto.
RUN mkdir -p /work/desktop/node_modules /work/docs/storybook/node_modules /pnpm-store \
  && chown -R node:node /work /pnpm-store

USER node
ENV CI=true \
  npm_config_store_dir=/pnpm-store
WORKDIR /work
