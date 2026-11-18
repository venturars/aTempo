#!/bin/sh
# Comprueba el bucket justifications: PUT, GET y content-type.
# En el host, ENDPOINT=http://127.0.0.1:9000 (RustFS ya en marcha).
# Compose pasa ENDPOINT=http://rustfs-test-store:9000.

set -eu

ENDPOINT=${ENDPOINT:-http://127.0.0.1:9000}
KEY=55555555-5555-5555-5555-555555555555
BODY=/tmp/justification.bin
GOT=/tmp/got.bin

export AWS_MAX_ATTEMPTS=1
i=0
until aws --cli-connect-timeout 2 --cli-read-timeout 2 --endpoint-url "$ENDPOINT" s3 ls >/dev/null 2>&1; do
  i=$((i + 1))
  if [ "$i" -gt 30 ]; then
    echo "FAIL: RustFS did not become ready"
    exit 1
  fi
  sleep 1
done

aws --endpoint-url "$ENDPOINT" s3api head-bucket --bucket justifications >/dev/null 2>&1 \
  || aws --endpoint-url "$ENDPOINT" s3 mb s3://justifications

printf 'justificante-de-prueba' > "$BODY"

aws --endpoint-url "$ENDPOINT" s3api put-object \
  --bucket justifications \
  --key "$KEY" \
  --body "$BODY" \
  --content-type application/pdf >/dev/null

aws --endpoint-url "$ENDPOINT" s3api get-object \
  --bucket justifications \
  --key "$KEY" \
  "$GOT" >/dev/null

want=$(cat "$BODY")
got=$(cat "$GOT")
if [ "$got" != "$want" ]; then
  echo "FAIL: object body mismatch"
  exit 1
fi
echo "ok: get object body"

content_type=$(aws --endpoint-url "$ENDPOINT" s3api head-object \
  --bucket justifications \
  --key "$KEY" \
  --query ContentType \
  --output text)

if [ "$content_type" != "application/pdf" ]; then
  echo "FAIL: expected content-type application/pdf, got $content_type"
  exit 1
fi
echo "ok: content-type"

echo "ok: rustfs bucket tests"
