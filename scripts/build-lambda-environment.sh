#!/usr/bin/env bash
# Build AWS Lambda environment JSON from the runner environment.
# Runner env uses base names (e.g. COMMERCE_BASE_URL); staging deploy → Lambda keys …_STAGING.
set -euo pipefail

PROFILE="${1:-}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MAPPING="$ROOT/lambda-env-mapping.json"

if [[ "$PROFILE" != "staging" && "$PROFILE" != "production" ]]; then
  echo "Usage: $0 staging|production" >&2
  exit 1
fi

vars='{}'
while read -r name; do
  val="${!name:-}"
  if [[ -z "$val" ]]; then
    continue
  fi
  if [[ "$PROFILE" == "staging" ]]; then
    key="${name}_STAGING"
  else
    key="$name"
  fi
  vars=$(jq -n --argjson o "$vars" --arg k "$key" --arg v "$val" '$o + {($k): $v}')
done < <(jq -r '(.commerce_secret_names // []) + (.dms_secret_names // []) + (.aws_secret_names // []) | .[]' "$MAPPING")

jq -n --argjson v "$vars" '{Variables: $v}'
