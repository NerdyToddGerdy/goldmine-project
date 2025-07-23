# 🛠️ Goldmine Project Build Order

## Phase 1: Core Game Logic (Local Dev)
- [x] Write Lambda `handler.py` using Poetry
- [x] Test locally

## 🛠️ Phase 2: Infra + Deploy (Pulumi + No-Zip Lambda)

- [x] Create `infra/` folder with `Pulumi.yaml` and `__main__.py`
- [x] Define IAM role and policy for Lambda execution
- [x] Build Lambda function using Poetry + `build.sh` (no zip file)
- [x] Configure Pulumi to deploy from `lambda/build/` using `FileArchive`
- [x] Create API Gateway:
  - [x] Rest API
  - [x] `/gold` resource
  - [x] `POST` method
  - [x] Lambda integration
  - [x] Deployment + stage (`/dev`)
- [x] Add `depends_on` to ensure deployment waits for integration
- [x] Use `stage.execution_arn` for Lambda permission source ARN
- [x] Export full endpoint using `api.id`, `aws.config.region`, and `stage.stage_name`
- [x] Test endpoint with `curl` and confirm `Hello from Goldmine` response


## 🧠 Phase 3: DynamoDB Integration

- [x] Create DynamoDB table (`goldmineSaves`) using Pulumi
- [x] Define `player_id` as the partition key (string)
- [x] Grant Lambda permission to `GetItem`, `PutItem`, `UpdateItem` on the table
- [x] Pass table name to Lambda via environment variable (`TABLE_NAME`)
- [x] Update Lambda `handler.py` to:
  - [x] Handle `POST` requests and store `{ player_id, gold }`
  - [x] Handle `GET` requests and retrieve `{ player_id, gold }`
- [x] Add fallback when `queryStringParameters` is missing (avoid `NoneType.get`)
- [x] Fix `Decimal` serialization using `DecimalEncoder` for `json.dumps()`
- [x] Add standalone `test_api.py` script in `tests/`:
  - [x] Dynamically resolves API URL via boto3
  - [x] Sends POST and GET requests using `requests`
- [x] Confirm save/load workflow works end-to-end with real AWS calls

## Phase 4: CI/CD
- [ ] Add GitHub Actions (`.github/workflows/deploy.yml`)
- [ ] Add secrets: `AWS_*`, `PULUMI_ACCESS_TOKEN`

## Phase 5: Frontend
- [ ] Build HTML/PyScript UI
- [ ] Hook into API Gateway endpoints
- [ ] Host via S3 (optional)

## Phase 6: Polish & Scale
- [ ] Error handling
- [ ] Add versioning or sessions
