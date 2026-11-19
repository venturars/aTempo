# Entorno de instalación de aTempo: Node, pnpm, git y APM con las mismas versiones para todo el equipo.
# Lo usan docker-compose.yml y .devcontainer/devcontainer.json.
# Dos etapas: base (instalar y comprobar) y desktop-gui (abrir Electron, opcional).
# Debian 13 (trixie): el binario de APM necesita glibc 2.38 o superior, y Debian 12 trae la 2.36.
FROM node:24.22.3-trixie AS base

# Electron 44 trae Node 24. pnpm sale de packageManager en desktop/, docs/storybook/, api-router/, blockend/ y postgres/.
ARG PNPM_VERSION=10.33.0
ARG APM_VERSION=0.35.0
# Checksums de apm-linux-*.tar.gz en la release de APM. Cambian con APM_VERSION.
ARG APM_SHA256_ARM64=ada8901ce1b29e5d188629eeed64e8499853a8cb5f047630ebedbde24008508e
ARG APM_SHA256_X86_64=5aa23ce61eebae9411668f507772cdb5d87252c760078dc59b5acdc5188d785b
# Snapshot de Python para que el runtime Linux del venv sea reproducible.
ARG DEBIAN_SNAPSHOT=20261116T000000Z
# Lo pone Docker al construir: arm64 en Apple Silicon, amd64 en la mayoría de PCs.
ARG TARGETARCH

RUN npm install --global "pnpm@${PNPM_VERSION}"

# Python de Debian solo prepara el venv; las dependencias de la API van dentro de su volumen.
USER root
RUN apt-get update --snapshot "$DEBIAN_SNAPSHOT" \
  && apt-get install -y --no-install-recommends --snapshot "$DEBIAN_SNAPSHOT" \
    python3.13=3.13.5-2+deb13u5 \
    python3.13-venv=3.13.5-2+deb13u5 \
  && rm -rf /var/lib/apt/lists/* \
  && ln -s /usr/bin/python3.13 /usr/local/bin/python3

# APM usa su Python integrado; Python del sistema ejecuta el servicio Flask.
RUN case "$TARGETARCH" in \
    arm64) arch=arm64; sha256=$APM_SHA256_ARM64 ;; \
    amd64) arch=x86_64; sha256=$APM_SHA256_X86_64 ;; \
    *) echo "Arquitectura sin binario de APM: $TARGETARCH" >&2; exit 1 ;; \
  esac \
  && curl -fsSL -o /tmp/apm.tar.gz "https://github.com/microsoft/apm/releases/download/v${APM_VERSION}/apm-linux-${arch}.tar.gz" \
  && echo "${sha256}  /tmp/apm.tar.gz" | sha256sum -c - \
  && mkdir -p /opt/apm \
  && tar -xzf /tmp/apm.tar.gz -C /opt/apm --strip-components=1 \
  && rm /tmp/apm.tar.gz \
  && ln -s /opt/apm/apm /usr/local/bin/apm

# El repositorio llega montado desde otro ordenador: git no tiene que quejarse del dueño.
RUN git config --system --add safe.directory '*'

# Los node_modules de Linux viven en volúmenes, nunca en la carpeta del proyecto.
RUN mkdir -p /work/desktop/node_modules /work/docs/storybook/node_modules /work/api-router/node_modules /work/blockend/node_modules /work/postgres/node_modules \
    /work/api-postgresql/node_modules /work/api-rustfs/node_modules /work/api-sqlite/.venv \
    /var/lib/atempo /pnpm-store \
  && chown -R node:node /work /var/lib/atempo /pnpm-store

USER node
ENV CI=true \
  npm_config_store_dir=/pnpm-store
WORKDIR /work

# Opcional: las librerías de escritorio que Chromium necesita para abrir la ventana de Electron.
# Solo las usa el servicio desktop-gui. Nombres de Debian 13: varias acaban en t64.
# Con estas cuatro, apt instala el resto como dependencias (atk, cups, drm, las de X11…).
FROM base AS desktop-gui

# Los paquetes salen del snapshot compartido con la etapa base; cambia fecha y versiones juntos.

USER root
RUN apt-get update --snapshot "$DEBIAN_SNAPSHOT" \
  && apt-get install -y --no-install-recommends --snapshot "$DEBIAN_SNAPSHOT" \
    libgtk-3-0t64=3.24.49-3 \
    libnss3=2:3.110-1+deb13u5 \
    libasound2t64=1.2.14-1+deb13u1 \
    libgbm1=25.0.7-2+deb13u1 \
  && rm -rf /var/lib/apt/lists/*
USER node
