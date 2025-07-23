# 🛠️ Goldmine Project Build Order

## Phase 1: Core Game Logic (Local Dev)
- [ ] Write Lambda `handler.py` using Poetry
- [ ] Test locally

## Phase 2: Infra + Deploy
- [ ] Create Pulumi project (`Pulumi.yaml`, `__main__.py`)
- [ ] Add Lambda + API Gateway
- [ ] Run `build.sh` to create `function.zip`
- [ ] Deploy via `pulumi up`

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
