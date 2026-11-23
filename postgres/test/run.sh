#!/bin/sh
# Comprueba el esquema de Postgres. En el host: PGDATABASE=atempo_schema_test.
# Compose monta 01_schema.sql en /schema.sql, 02_unique_lower.sql en
# /unique_lower.sql y los tests en /tests.

set -eu

if [ -f /schema.sql ]; then
  SCHEMA=/schema.sql
  LOWER=/unique_lower.sql
  TESTS=/tests
else
  SCRIPT_DIR=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
  SCHEMA="$SCRIPT_DIR/../init/01_schema.sql"
  LOWER="$SCRIPT_DIR/../init/02_unique_lower.sql"
  TESTS="$SCRIPT_DIR"
fi

psql -v ON_ERROR_STOP=1 <<'SQL'
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
SQL

psql -v ON_ERROR_STOP=1 -f "$SCHEMA"
psql -v ON_ERROR_STOP=1 -f "$LOWER"
psql -v ON_ERROR_STOP=1 -f "$TESTS/valid.sql"

must_fail() {
  name=$1
  sql=$2
  if psql -v ON_ERROR_STOP=1 -c "$sql" >/tmp/psql.out 2>&1; then
    echo "FAIL: $name should have been rejected"
    cat /tmp/psql.out
    exit 1
  fi
  echo "ok: $name rejected"
}

table_count=$(psql -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'")
if [ "$table_count" != "6" ]; then
  echo "FAIL: expected 6 tables, got $table_count"
  exit 1
fi
echo "ok: six tables"

lower_idx=$(psql -tAc "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' AND indexname IN ('person_email_lower_idx', 'course_contract_address_lower_idx', 'organization_tax_id_lower_idx', 'person_identification_document_lower_idx')")
if [ "$lower_idx" != "4" ]; then
  echo "FAIL: expected four lower unique indexes, got $lower_idx"
  exit 1
fi
echo "ok: lower unique indexes"

role_names=$(psql -tAc "SELECT string_agg(name, ',' ORDER BY name) FROM role")
if [ "$role_names" != "organization_admin,student,teacher" ]; then
  echo "FAIL: expected seeded roles, got $role_names"
  exit 1
fi
echo "ok: role seed"

must_fail "invalid contract_address" \
  "INSERT INTO course (organization_id, name, acronym, start_at, end_at, contract_address) VALUES ('11111111-1111-1111-1111-111111111111', 'Rust', 'RST', '2026-01-01 00:00:00+00', '2026-06-01 00:00:00+00', 'not-an-address');"

must_fail "end_at before start_at" \
  "INSERT INTO course (organization_id, name, acronym, start_at, end_at, contract_address) VALUES ('11111111-1111-1111-1111-111111111111', 'Rust', 'RST', '2026-06-01 00:00:00+00', '2026-01-01 00:00:00+00', '0xabcdef1234567890abcdef1234567890abcdef12');"

must_fail "duplicate tax_id" \
  "INSERT INTO organization (name, tax_id) VALUES ('Otra', 'B12345678');"

must_fail "duplicate tax_id case" \
  "INSERT INTO organization (name, tax_id) VALUES ('Otra', 'b12345678');"

must_fail "duplicate identification_document" \
  "INSERT INTO person (identification_document, email, first_name, last_name) VALUES ('12345678A', 'otra@example.com', 'Otra', 'Persona');"

must_fail "duplicate identification_document case" \
  "INSERT INTO person (identification_document, email, first_name, last_name) VALUES ('12345678a', 'otra2@example.com', 'Otra', 'Persona');"

must_fail "duplicate email" \
  "INSERT INTO person (identification_document, email, first_name, last_name) VALUES ('99999999Z', 'ana@example.com', 'Otra', 'Persona');"

must_fail "duplicate email case" \
  "INSERT INTO person (identification_document, email, first_name, last_name) VALUES ('99999999Z', 'ANA@example.com', 'Otra', 'Persona');"

must_fail "duplicate contract_address" \
  "INSERT INTO course (organization_id, name, acronym, start_at, end_at, contract_address) VALUES ('11111111-1111-1111-1111-111111111111', 'Rust', 'RST', '2026-01-01 00:00:00+00', '2026-06-01 00:00:00+00', '0x1234567890abcdef1234567890abcdef12345678');"

must_fail "duplicate contract_address case" \
  "INSERT INTO course (organization_id, name, acronym, start_at, end_at, contract_address) VALUES ('11111111-1111-1111-1111-111111111111', 'Rust', 'RST', '2026-01-01 00:00:00+00', '2026-06-01 00:00:00+00', '0x1234567890ABCDEF1234567890ABCDEF12345678');"

must_fail "duplicate organization acronym" \
  "INSERT INTO course (organization_id, name, acronym, start_at, end_at, contract_address) VALUES ('11111111-1111-1111-1111-111111111111', 'Solidity 2', 'SOL', '2026-01-01 00:00:00+00', '2026-06-01 00:00:00+00', '0xabcdef1234567890abcdef1234567890abcdef12');"

must_fail "student then teacher" \
  "INSERT INTO person_role (person_id, role) VALUES ('33333333-3333-3333-3333-333333333333', 'teacher');"

must_fail "teacher then student" \
  "INSERT INTO person_role (person_id, role) VALUES ('22222222-2222-2222-2222-222222222222', 'student');"

must_fail "unknown role" \
  "INSERT INTO role (name) VALUES ('admin');"

echo "ok: postgres schema tests"
