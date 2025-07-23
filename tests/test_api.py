# /test/test_api.py
import boto3
import requests


api_name = "goldmineApi"
region = "us-east-1"
stage_name = "dev"


def get_api_url() -> str:
    client = boto3.client("apigateway", region_name=region)

    # Find the API ID by name
    apis = client.get_rest_apis()
    rest_api = next((api for api in apis['items'] if api['name'] == api_name), None)
    if not rest_api:
        raise Exception(f"API with name {api_name} not found")

    api_id = rest_api['id']
    return f"https://{api_id}.execute-api.{region}.amazonaws.com/{stage_name}/gold"


def save(base_url: str, player_id: str, gold: int):
    response = requests.post(base_url, json={
        "player_id": player_id,
        "gold": gold,
    })
    print("SAVE RESPONSE:")
    print(response.status_code)
    print(response.json())
    print("-" * 40)


def load(base_url: str, player_id: str):
    response = requests.get(base_url, params={"player_id": player_id})
    print("LOAD RESPONSE:")
    print(response.status_code)
    print(response.json())
    print("-" * 40)


if __name__ == "__main__":
    url: str = get_api_url()
    print(f"Resolved API URL: {url}")

    player: str = "todd"
    save(url, player, 99)
    load(url, player)
