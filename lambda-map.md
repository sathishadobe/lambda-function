# AWS Lambda Function Naming Convention

## Overview

This project uses a configurable mapping system to transform source folder names into AWS Lambda function names. The mapping is defined in [lambda-map.json](lambda-map.json) and supports flexible naming conventions.

## Current Function Mapping

### Active Functions
| Source Folder | Base Lambda Name | Purpose |
|---------------|------------------|---------|
| `src/get-token/` | `kinesis-consumer` | GraphQL authentication and token generation |

## Naming Convention

### 1. Folder to Base Name Mapping
The mapping is defined in [lambda-map.json](lambda-map.json):
```json
{
  "get-token": "kinesis-consumer"
}
```

### 2. Environment Suffix Pattern
Final AWS Lambda function names follow this pattern:
```
<base-name>-<environment>
```

### 3. Current Deployments
- **Staging:** `kinesis-consumer-staging` (deployed from `staging` branch)
- **Production:** `kinesis-consumer-prod` (deployed from `master` branch)

## Adding New Functions

To add a new Lambda function:

1. **Create source folder:** `src/your-function-name/`
2. **Add handler file:** `src/your-function-name/index.mjs`
3. **Update mapping:** Add entry to [lambda-map.json](lambda-map.json)
4. **Deploy:** Push to appropriate branch (`staging` or `master`)

### Example: Adding a new function
```json
{
  "get-token": "kinesis-consumer",
  "process-data": "data-processor"
}
```

This would create:
- `data-processor-staging`
- `data-processor-prod`