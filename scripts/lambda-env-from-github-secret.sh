#!/usr/bin/env bash
# Reads JSON object from env LAMBDA_ENVIRONMENT_VARIABLES (GitHub Actions secret) and
# prints { "Variables": { ... } } for aws lambda update-function-configuration.
# Staging: use Lambda key names with *_STAGING where your code expects them.
# Production: use unsuffixed keys (same names as process.env in Node).
set -euo pipefail

if [[ -z "${LAMBDA_ENVIRONMENT_VARIABLES:-}" ]]; then
  echo "::error::LAMBDA_ENVIRONMENT_VARIABLES is empty. Add repository/environment secret LAMBDA_ENVIRONMENT_VARIABLES with a JSON object of all Lambda environment variables." >&2
  exit 1
fi

if ! printf '%s' "$LAMBDA_ENVIRONMENT_VARIABLES" | jq -e 'type == "object"' >/dev/null 2>&1; then
  echo "::error::LAMBDA_ENVIRONMENT_VARIABLES must be a single JSON object, e.g. {\"COMMERCE_BASE_URL_STAGING\":\"https://...\",\"DMS_TOKEN_URL_STAGING\":\"...\"}" >&2
  exit 1
fi

printf '%s' "$LAMBDA_ENVIRONMENT_VARIABLES" | jq '{Variables: .}'
