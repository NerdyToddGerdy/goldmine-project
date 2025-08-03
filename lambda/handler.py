import json
import os
import boto3

from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get("TABLE_NAME", 'goldmineSaves')
table = dynamodb.Table(table_name)


def handler(event, context):
    method = event.get("httpMethod", "GET")

    if method == "POST":
        body = json.loads(event.get("body", "{}"))
        player_id = body.get("player_id", "unknown")
        gold = body.get("gold", 0)

        table.put_item(Item={"player_id": player_id, "gold": Decimal(str(gold))})
        return {
            "statusCode": 200,
            "body": json.dumps({
                "message": "Saved",
                "player_id": player_id,
                "gold": gold
            })
        }
    elif method == "GET":
        player_id = event.get("queryStringParameters", {}).get("player_id", "unknown")
        result = table.get_item(Key={"player_id": player_id})
        item = result.get("Item", {"gold": 0})
        gold = item.get("gold", Decimal(0))
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
            },
            "body": json.dumps({
                "player_id": player_id,
                "gold": float(gold),
            })
        }

    return {
        "statusCode": 400,
        "body": json.dumps({"error": "Unsupported method"})
    }
