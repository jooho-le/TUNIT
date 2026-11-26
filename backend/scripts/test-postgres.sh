#!/usr/bin/env bash
# Creates only its own temporary PostgreSQL cluster; never uses DB_URL or an existing service.
set -euo pipefail
TUNIT_BACKEND_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TUNIT_PG_BIN="${TUNIT_PG_BIN:-$(pg_config --bindir)}"
TUNIT_WORK_DIR="$(mktemp -d "${TMPDIR:-/tmp}/tunit-postgres.XXXXXX")"
TUNIT_PG_STARTED=0
chmod 700 "$TUNIT_WORK_DIR"
cleanup() {
  TUNIT_EXIT_STATUS=$?
  if [ "$TUNIT_PG_STARTED" = 1 ]; then
    "$TUNIT_PG_BIN/pg_ctl" -D "$TUNIT_WORK_DIR/data" -m fast -w stop >/dev/null
  fi
  rm -rf -- "$TUNIT_WORK_DIR"
  exit "$TUNIT_EXIT_STATUS"
}
trap cleanup EXIT
TUNIT_TEST_PASSWORD="$(openssl rand -hex 32)"
printf '%s\n' "$TUNIT_TEST_PASSWORD" > "$TUNIT_WORK_DIR/password"
chmod 600 "$TUNIT_WORK_DIR/password"
"$TUNIT_PG_BIN/initdb" -D "$TUNIT_WORK_DIR/data" --username=tunit_test --pwfile="$TUNIT_WORK_DIR/password" \
  --auth-local=scram-sha-256 --auth-host=scram-sha-256 --encoding=UTF8 --locale=C > "$TUNIT_WORK_DIR/initdb.log"
TUNIT_TEST_PORT="$(python3 - <<'PY'
import socket
with socket.socket() as connection:
    connection.bind(('127.0.0.1', 0))
    print(connection.getsockname()[1])
PY
)"
"$TUNIT_PG_BIN/pg_ctl" -D "$TUNIT_WORK_DIR/data" -l "$TUNIT_WORK_DIR/postgres.log" \
  -o "-h 127.0.0.1 -p $TUNIT_TEST_PORT -k $TUNIT_WORK_DIR" -w start >/dev/null
TUNIT_PG_STARTED=1
export PGPASSWORD="$TUNIT_TEST_PASSWORD"
"$TUNIT_PG_BIN/createdb" -h 127.0.0.1 -p "$TUNIT_TEST_PORT" -U tunit_test tunit_test
export TUNIT_TEST_DB_URL="jdbc:postgresql://127.0.0.1:$TUNIT_TEST_PORT/tunit_test"
export TUNIT_TEST_DB_USERNAME=tunit_test
export TUNIT_TEST_DB_PASSWORD="$TUNIT_TEST_PASSWORD"
if [ -n "${TUNIT_JAVA_HOME:-}" ]; then
  export JAVA_HOME="$TUNIT_JAVA_HOME"
elif [ -x /opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home/bin/java ]; then
  export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
fi
cd "$TUNIT_BACKEND_DIR"
"${TUNIT_GRADLE_BIN:-./gradlew}" --no-daemon --console=plain test bootJar --rerun-tasks
mkdir -p build/reports
{
  printf 'Temporary PostgreSQL verification (cluster stopped after this report)\n'
  "$TUNIT_PG_BIN/psql" -h 127.0.0.1 -p "$TUNIT_TEST_PORT" -U tunit_test -d tunit_test -X -c 'SELECT version FROM flyway_schema_history WHERE success ORDER BY installed_rank;'
  "$TUNIT_PG_BIN/psql" -h 127.0.0.1 -p "$TUNIT_TEST_PORT" -U tunit_test -d tunit_test -X -c "SELECT count(*) AS domain_tables FROM information_schema.tables WHERE table_schema='public' AND table_name <> 'flyway_schema_history';"
} > build/reports/postgres-verification.txt
printf 'PASS: PostgreSQL integration checks and bootJar. Reports: backend/build/reports/\n'
