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


## Phase 3: Add Storage
- [ ] Create DynamoDB table in Pulumi
- [ ] Update Lambda to save/load state
- [ ] Test with curl or frontend

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
