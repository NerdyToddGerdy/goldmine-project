# 💲 Goldmine Lambda

Serverless backend for the **Goldmine Tycoon** game, built in **Python**, managed with **Poetry**, and deployed via **Pulumi** to **AWS Lambda**. This function powers in-game events such as gold selling, player actions, and game progression logic.

---

## 📌 Project Goals

* Provide scalable and low-latency backend logic for the Goldmine game
* Use AWS Lambda for cost-effective compute
* Cleanly manage Python dependencies with Poetry
* Use Pulumi for reproducible cloud infrastructure as code

---

## 📁 Project Structure

```
goldmine-lambda/
├── handler.py             # Main Lambda function handler
├── pyproject.toml         # Poetry-managed dependencies
├── poetry.lock            # Locked dependency versions
├── Pulumi.yaml            # Pulumi project definition
├── Pulumi.dev.yaml        # Pulumi stack config (example)
├── README.md              # This file
├── requirements.txt       # (Generated) for packaging
└── lambda_package/        # (Optional) Build artifact folder for deployment
```

---

## ⚙️ Setup

### 1. Install Python & Poetry

Make sure you have Python 3.12 and Poetry installed:

```bash
poetry env use python3.12
poetry install
```

If not packaging the local code as a module:

```bash
poetry install --no-root
```

---

### 2. Install Pulumi

Install Pulumi CLI:
[https://www.pulumi.com/docs/install/](https://www.pulumi.com/docs/install/)

Log in (local or cloud backend):

```bash
pulumi login
```

---

## 🚀 Deployment

Pulumi will deploy:

* An AWS Lambda function (based on `handler.py`)
* IAM roles and policies (for Lambda execution)
* Optional: API Gateway trigger or other integrations

### Deploy Steps

```bash
# Set up a stack (e.g., dev, prod)
pulumi stack init dev

# Configure AWS region (optional)
pulumi config set aws:region us-east-1

# Deploy
pulumi up
```

---

## 📊 Local Testing

Run the handler locally using:

```bash
poetry run python handler.py
```

If using test scripts, you can also run:

```bash
poetry add --group dev pytest
poetry run pytest
```

---

## 📦 Building a Lambda Package (Optional for FileArchive)

If deploying with `aws.lambda_.Function(..., code=FileArchive(...))`, build a deployable zip:

```bash
poetry export -f requirements.txt --without-hashes > requirements.txt
pip install -r requirements.txt -t lambda_package/
cp handler.py lambda_package/
cd lambda_package && zip -r ../goldmine-lambda.zip .
```

Pulumi can then use:

```python
code=pulumi.FileArchive("./lambda_package")
```

---

## 📚 Dependencies

All dependencies are managed via Poetry:

```toml
[tool.poetry.dependencies]
python = "^3.12"
boto3 = ">=1.39.11,<2.0.0"
```

Lockfile ensures reproducible builds (`poetry.lock`).

---

## 🧐 Notes

* Uses `package-mode = false` in `pyproject.toml` to skip Poetry packaging (since we're deploying a function, not a module).
* Avoids zipping unnecessary files by keeping only `handler.py` and needed packages in deployment folder.

---

## ✅ TODO / Coming Soon

* [ ] Add unit tests for handler logic
* [ ] Integrate with S3 or DynamoDB for persistence
* [ ] Trigger via API Gateway or EventBridge
* [ ] Add multiple Lambda functions (multi-handler setup)

---

## 📝 License

MIT (or your choice)

---

## 👤 Author

**Todd Gerdy**
[toadimous@gmail.com](mailto:toadimous@gmail.com)
[Nerdy Gerdy Games on Twitch](https://twitch.tv/nerdygerdygames)
