#!/usr/bin/env bash
# Exercise the post-checkout setup hook in isolated Git repositories.

set -euo pipefail

repository_root=$(git rev-parse --show-toplevel)
temporary_base=${TMPDIR:-/tmp}
mkdir -p "$temporary_base"
temporary_base=$(cd "$temporary_base" && pwd -P)
temporary_root=$(mktemp -d "$temporary_base/atempo-setup-hook.XXXXXX")
case "$temporary_root" in
  "$temporary_base"/atempo-setup-hook.*) ;;
  *) echo "Unexpected temporary test directory: $temporary_root" >&2; exit 1 ;;
esac

cleanup() {
  case "$temporary_root" in
    "$temporary_base"/atempo-setup-hook.*) rm -rf -- "$temporary_root" ;;
    *) echo "Refusing to remove unexpected path: $temporary_root" >&2; return 1 ;;
  esac
}
trap cleanup EXIT

assert_contains() {
  local output=$1
  local expected=$2
  [[ "$output" == *"$expected"* ]] || {
    echo "Expected output to contain: $expected" >&2
    echo "$output" >&2
    exit 1
  }
}

run_hook_case() {
  local case_name=$1
  local changed_path=$2
  local docker_mode=$3
  local expected_calls=$4
  local case_root="$temporary_root/$case_name"
  local mock_bin="$case_root/mock-bin"
  local call_log="$case_root/docker-calls.log"
  local initial_commit
  local output

  mkdir -p "$case_root" "$mock_bin" \
    "$case_root/.agents/skills/delivery-workflow" \
    "$case_root/.claude/skills/delivery-workflow"
  cp "$repository_root/.githooks/run-setup.sh" "$case_root/run-setup.sh"
  git -C "$case_root" init -q
  git -C "$case_root" config user.name "Hook test"
  git -C "$case_root" config user.email "hook-test@example.invalid"
  git -C "$case_root" config core.autocrlf false
  mkdir -p "$(dirname "$case_root/$changed_path")"
  printf 'initial\n' > "$case_root/$changed_path"
  git -C "$case_root" add "$changed_path"
  git -C "$case_root" commit -qm "initial"
  initial_commit=$(git -C "$case_root" rev-parse HEAD)

  printf 'updated\n' > "$case_root/$changed_path"
  git -C "$case_root" add "$changed_path"
  git -C "$case_root" commit -qm "update installation input"

  cat > "$mock_bin/docker" <<'MOCK_DOCKER'
#!/usr/bin/env bash
printf '%s\n' "$*" >> "$DOCKER_TEST_CALL_LOG"
if [[ "${DOCKER_TEST_MODE:-ready}" == "unavailable" && "$1" == info ]]; then
  exit 1
fi
exit 0
MOCK_DOCKER
  chmod +x "$mock_bin/docker"

  output=$(cd "$case_root" && PATH="$mock_bin:$PATH" \
    DOCKER_TEST_CALL_LOG="$call_log" DOCKER_TEST_MODE="$docker_mode" \
    bash ./run-setup.sh "$initial_commit" HEAD 2>&1)

  [[ -f "$call_log" ]] || : > "$call_log"
  local call_count
  call_count=$(wc -l < "$call_log" | tr -d ' ')
  [[ "$call_count" == "$expected_calls" ]] || {
    echo "$case_name expected $expected_calls Docker calls, got $call_count" >&2
    cat "$call_log" >&2
    exit 1
  }

  if [[ "$expected_calls" == 2 ]]; then
    assert_contains "$(cat "$call_log")" "info"
    assert_contains "$(cat "$call_log")" "compose run --build --rm setup"
  elif [[ "$docker_mode" == "unavailable" ]]; then
    assert_contains "$output" "Docker no está en marcha"
  fi
}

installation_inputs=(
  apm.yml
  apm.lock.yaml
  desktop/pnpm-lock.yaml
  docs/storybook/pnpm-lock.yaml
  api-router/pnpm-lock.yaml
  api-postgresql/pnpm-lock.yaml
  api-rustfs/pnpm-lock.yaml
  api-sqlite/pyproject.toml
  Dockerfile
  .dockerignore
  docker-compose.yml
  docker/setup.sh
  docker/entrypoint.sh
)

for input_path in "${installation_inputs[@]}"; do
  input_name=${input_path//\//-}
  run_hook_case "changed-${input_name}" "$input_path" ready 2
done

run_hook_case "unrelated-file" "README.md" ready 0
run_hook_case "docker-unavailable" "api-sqlite/pyproject.toml" unavailable 1

echo "All setup hook tests passed."
