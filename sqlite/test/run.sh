#!/bin/sh
# Comprueba el esquema de SQLite operativo sobre un fichero temporal.

set -eu

if [ -f /schema.sql ]; then
  SCHEMA=/schema.sql
  TESTS=/tests
  DB=/tmp/test.sqlite
else
  SCRIPT_DIR=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
  SCHEMA="$SCRIPT_DIR/../schema.sql"
  TESTS="$SCRIPT_DIR"
  DB=$(mktemp "${TMPDIR:-/tmp}/atempo-sqlite-test.XXXXXX")
  trap 'rm -f "$DB"' EXIT
fi

rm -f "$DB"

sqlite3 "$DB" < "$SCHEMA"
sqlite3 "$DB" < "$TESTS/valid.sql"

must_fail() {
  name=$1
  file=$2
  if { echo "PRAGMA foreign_keys = ON;"; cat "$file"; } | sqlite3 -bail "$DB" 2>/tmp/sqlite.err; then
    echo "FAIL: $name should have been rejected"
    cat /tmp/sqlite.err
    exit 1
  fi
  echo "ok: $name rejected"
}

table_count=$(sqlite3 "$DB" "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%';")
if [ "$table_count" != "2" ]; then
  echo "FAIL: expected 2 tables, got $table_count"
  exit 1
fi
echo "ok: two tables"

must_fail "invalid status" "$TESTS/reject-status.sql"
must_fail "invalid check_in_method" "$TESTS/reject-check-in-method.sql"
must_fail "closed without closed_at" "$TESTS/reject-closed-without-closed-at.sql"
must_fail "open with closed_at" "$TESTS/reject-open-with-closed-at.sql"
must_fail "closing with closed_at" "$TESTS/reject-closing-with-closed-at.sql"
must_fail "end_at before start_at" "$TESTS/reject-end-before-start.sql"
must_fail "duplicate attendance primary key" "$TESTS/reject-duplicate-attendance.sql"
must_fail "attendance without session" "$TESTS/reject-missing-session.sql"

echo "ok: sqlite schema tests"
