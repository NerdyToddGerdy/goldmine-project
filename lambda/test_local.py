# lambda/test_local.py

from handler import handler

if __name__ == "__main__":
    event = {
        "httpMethod": "GET",
        "path": "/",
        "body": None
    }
    result = handler(event, context=None)
    print(result)
