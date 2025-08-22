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

## Phase 4: CI/CD [SKIPPED]
- [ ] Add GitHub Actions (`.github/workflows/deploy.yml`)
- [ ] Add secrets: `AWS_*`, `PULUMI_ACCESS_TOKEN`

## Phase 5: Frontend 
- [x] Build HTML/Typescript UI
- [ ] Hook into API Gateway endpoints [SKIPPING]
- [ ] HUD polish
- [ ] +Amount popups
- [ ] Responsive Design
- [ ] Progress Bars

## Phase 6: Prestige
- [ ] Figure out Different upgrades to add via prestige
- [ ] Implement said upgrades. (sleuce box, furnace, etc.)

## Phase 6: Polish & Scale
- [ ] Error handling
- [ ] Add versioning or sessions
- [ ] Host via S3 (optional) 


🛠️ Goldmine Project Build Order

[//]: # (Phase 1: Core Game Logic &#40;Local Dev&#41;)

[//]: # ( Write Lambda handler.py using Poetry)

[//]: # ()
[//]: # ( Test locally)

[//]: # ()
[//]: # (🛠️ Phase 2: Infra + Deploy &#40;Pulumi + No-Zip Lambda&#41;)

[//]: # ( Create infra/ folder with Pulumi.yaml and __main__.py)

[//]: # ()
[//]: # ( Define IAM role and policy for Lambda execution)

[//]: # ()
[//]: # ( Build Lambda function using Poetry + build.sh &#40;no zip file&#41;)

[//]: # ()
[//]: # ( Configure Pulumi to deploy from lambda/build/ using FileArchive)

[//]: # ()
[//]: # ( Create API Gateway:)

[//]: # ()
[//]: # ( Rest API)

[//]: # ()
[//]: # ( /gold resource)

[//]: # ()
[//]: # ( POST method)

[//]: # ()
[//]: # ( Lambda integration)

[//]: # ()
[//]: # ( Deployment + stage &#40;/dev&#41;)

[//]: # ()
[//]: # ( Add depends_on to ensure deployment waits for integration)

[//]: # ()
[//]: # ( Use stage.execution_arn for Lambda permission source ARN)

[//]: # ()
[//]: # ( Export full endpoint using api.id, aws.config.region, and stage.stage_name)

[//]: # ()
[//]: # ( Test endpoint with curl and confirm Hello from Goldmine response)

[//]: # ()
[//]: # (🧠 Phase 3: DynamoDB Integration)

[//]: # ( Create DynamoDB table &#40;goldmineSaves&#41; using Pulumi)

[//]: # ()
[//]: # ( Define player_id as the partition key &#40;string&#41;)

[//]: # ()
[//]: # ( Grant Lambda permission to GetItem, PutItem, UpdateItem on the table)

[//]: # ()
[//]: # ( Pass table name to Lambda via environment variable &#40;TABLE_NAME&#41;)

[//]: # ()
[//]: # ( Update Lambda handler.py to:)

[//]: # ()
[//]: # ( Handle POST requests and store { player_id, gold })

[//]: # ()
[//]: # ( Handle GET requests and retrieve { player_id, gold })

[//]: # ()
[//]: # ( Add fallback when queryStringParameters is missing &#40;avoid NoneType.get&#41;)

[//]: # ()
[//]: # ( Fix Decimal serialization using DecimalEncoder for json.dumps&#40;&#41;)

[//]: # ()
[//]: # ( Add standalone test_api.py script in tests/:)

[//]: # ()
[//]: # ( Dynamically resolves API URL via boto3)

[//]: # ()
[//]: # ( Sends POST and GET requests using requests)

[//]: # ()
[//]: # ( Confirm save/load workflow works end-to-end with real AWS calls)

## Phase 4: CI/CD [SKIPPED]
-[ ] Add GitHub Actions (.github/workflows/deploy.yml)
-[ ] Add secrets: AWS_*, PULUMI_ACCESS_TOKEN

## Phase 5: Frontend
-[x] Build HTML/Typescript UI
-[ ] Hook into API Gateway endpoints [SKIPPING]
-[ ] HUD polish (gold animations, tooltips)
-[ ] +Amount popups above scoop, pan, sell sections
  - [ ] get +1 above proper item
-[ ] Responsive Design for different screen sizes
-[ ] Progress Bars with animations?
-[ ] Upgrade preview tooltip (next effect & cost)
-[ ] Visual feedback for bucket & shovel efficiency
-[ ] Prestige system UI integration
-[ ] New resources (gems, artifacts for bonus sales)
## Phase 6: Prestige
-[ ] Design prestige mechanics and bonuses
-[ ] Implement prestige-specific upgrades (sluice box, furnace, advanced tools)
-[ ] Add permanent bonuses for resetting progress
## Phase 7: Polish & Scale
-[ ] Error handling for Lambda responses
-[ ] Add versioning or session management
-[ ] Improve logging & monitoring (CloudWatch)
-[ ] Define scaling rules (concurrency, retries)
-[ ] Data persistence enhancements (advanced DynamoDB features)
-[ ] Optional hosting via S3
-[ ] Security improvements (IAM hardening, rate limiting)
-[ ] CloudWatch alerts for failures
-[ ] Add caching layer for repeated calculations