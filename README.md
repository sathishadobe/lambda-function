# maruti-lambda

Node.js **AWS Lambda** functions deployed by **zipping** each folder under `src/`, then calling `aws lambda update-function-code` and `aws lambda update-function-configuration`. **GitHub Actions** deploys **staging** and **production** when you push to the matching branches.

This repo does **not** use AWS SAM or CloudFormation here: Lambda functions must **already exist** in AWS with the expected names; CI only updates code and environment variables.

## Repository layout

| Path | Purpose |
|------|---------|
| `lambda-map.json` | Maps `src/<folder>/` to the **base** Lambda name in AWS. See [lambda-map.md](lambda-map.md). |
| `src/<folder>/index.mjs` | ESM handler: `export const handler`. |

**Current mapping**

| Source folder | Base name | AWS function names |
|---------------|-----------|---------------------|
| `get-token` | `kinesis-consumer` | `kinesis-consumer-staging`, `kinesis-consumer-prod` |

## What the handler does

[`src/get-token/index.mjs`](src/get-token/index.mjs) reads **`EMAIL`**, **`PASSWORD`**, and **`GRAPHQL_URL`** from the environment, POSTs a GraphQL mutation `generateCustomerToken`, logs the response, and returns `{ statusCode: 200, body }`. It uses native **`fetch`** (Node.js **18+** on Lambda).

## Prerequisites

- **Node.js 18+** if you run or test the handler locally (no `package.json` is required for the current code).
- **AWS CLI** for manual deploys.
- IAM allowing `lambda:UpdateFunctionCode` and `lambda:UpdateFunctionConfiguration` on the target functions.

## Manual deploy

Run from **this directory** (where `lambda-map.json` and `src/` live):

```bash
cd src/get-token
zip -r ../../get-token.zip .
cd ../..
aws lambda update-function-code \
  --function-name kinesis-consumer-staging \
  --zip-file fileb://get-token.zip \
  --region YOUR_REGION
```

Set **`EMAIL`**, **`PASSWORD`**, and **`GRAPHQL_URL`** in the Lambda console or via `aws lambda update-function-configuration`.

## CI/CD (GitHub Actions)

Workflows live under [`.github/workflows/`](.github/workflows/):

| Workflow | Branch | `ENV` suffix | Target example |
|----------|--------|--------------|----------------|
| [deploy-staging.yml](.github/workflows/deploy-staging.yml) | `staging` | `staging` | `kinesis-consumer-staging` |
| [deploy-prod.yml](.github/workflows/deploy-prod.yml) | `production` | `prod` | `kinesis-consumer-prod` |

**Process (both workflows):**

1. Checkout the repo.
2. Install `jq`.
3. Configure AWS with `aws-actions/configure-aws-credentials`.
4. For each key in `lambda-map.json`: zip `src/<folder>/`, `aws lambda update-function-code`, then `update-function-configuration` with app secrets.
5. Optionally verify config with `aws lambda get-function-configuration`.

**Region** is read from the GitHub Actions secret **`AWS_REGION`** (see workflows).

### Secrets (repository)

Configure under **Settings → Secrets and variables → Actions**:

| Secret | Used for |
|--------|----------|
| `AWS_ACCESS_KEY_ID` | AWS CLI in Actions |
| `AWS_SECRET_ACCESS_KEY` | AWS CLI in Actions |
| `AWS_REGION` | e.g. `ap-southeast-2` (passed to `configure-aws-credentials`) |
| `EMAIL_STAGE` | Lambda env `EMAIL` |
| `PASSWORD_STAGE` | Lambda env `PASSWORD` |
| `GRAPHQL_URL_STAGE` | Lambda env `GRAPHQL_URL` |

The **production** workflow uses the same **`EMAIL_STAGE`**, **`PASSWORD_STAGE`**, and **`GRAPHQL_URL_STAGE`** secret names. For different production values, add e.g. `EMAIL_PROD` / `PASSWORD_PROD` / `GRAPHQL_URL_PROD` and update [deploy-prod.yml](.github/workflows/deploy-prod.yml).

### Workflows must live at the GitHub repo root

GitHub only loads `.github/workflows/*.yml` from the **root of the repository** on GitHub. If this project is a **subfolder** inside a monorepo (e.g. `maruti-lambda/MSIL_Lambda/`), either:

- Move or duplicate the workflow YAML files to **`<repo-root>/.github/workflows/`**, and set `defaults.run.working-directory` to this folder (`MSIL_Lambda`) for `run` steps, or  
- Use a dedicated GitHub repository whose root **is** this folder so `.github/workflows/` sits at the top level.

## Adding a function

1. Add `src/<folder>/index.mjs` with `export const handler`.
2. Add `"<folder>": "<base-name>"` to `lambda-map.json`.
3. Create `<base-name>-staging` and `<base-name>-prod` in AWS (or change naming in the workflows).
4. Update [lambda-map.md](lambda-map.md) if you keep it in sync.

## Connect to GitHub

```bash
git remote add origin https://github.com/YOUR_ORG/YOUR_REPO.git
git push -u origin staging
```

Use branches **`staging`** and **`production`** to match the workflows above.
