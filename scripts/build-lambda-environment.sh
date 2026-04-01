#!/usr/bin/env bash
# Build AWS Lambda environment JSON from the runner environment.
#
# lambda-env-mapping.json "variables" lists allowed env var NAMES (base names).
# For each name: if the runner has a non-empty value, it is copied to Lambda.
#   staging   → Lambda key NAME_STAGING
#   production → Lambda key NAME
#
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
  [[ -z "$name" ]] && continue
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
done < <(jq -r '(.variables // [])[]' "$MAPPING")

jq -n --argjson v "$vars" '{Variables: $v}'
