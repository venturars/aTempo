#!/bin/sh
# Crea el bucket justifications si no existe.

set -eu

ENDPOINT=${ENDPOINT:-http://127.0.0.1:9000}

until aws --cli-connect-timeout 2 --cli-read-timeout 2 --endpoint-url "$ENDPOINT" s3 ls >/dev/null 2>&1; do
  sleep 1
done

aws --endpoint-url "$ENDPOINT" s3api head-bucket --bucket justifications >/dev/null 2>&1 \
  || aws --endpoint-url "$ENDPOINT" s3 mb s3://justifications
