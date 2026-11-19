#!/bin/sh
# Compose crea los volúmenes de dependencias vacíos y de root.
# Cada arranque los deja del usuario node y ejecuta el comando con ese usuario.
# Así cualquier copia del repositorio puede instalar sin un chown manual.

set -eu

if [ "$(id -u)" -eq 0 ]; then
  for dir in \
    /work/desktop/node_modules \
    /work/docs/storybook/node_modules \
    /work/api-router/node_modules \
    /work/api-postgresql/node_modules \
    /work/api-rustfs/node_modules \
    /work/api-sqlite/.venv \
    /work/blockend/node_modules \
    /work/postgres/node_modules \
    /pnpm-store \
    /var/lib/atempo
  do
    if [ -d "$dir" ]; then
      chown node:node "$dir"
      chmod 755 "$dir"
    fi
  done
  # setpriv no cambia HOME: sin esto, APM usa /root y rechaza su lock.
  export HOME=/home/node
  export USER=node
  export LOGNAME=node
  exec setpriv --reuid=node --regid=node --init-groups -- "$@"
fi

exec "$@"
