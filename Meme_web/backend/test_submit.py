import requests
import json

url = "http://localhost:8000/api/submit_batch"

payload = [
    {
        "image_name": "test_image_1.jpg",
        "target": "Test Target",
        "justification": "Test Justification",
        "stance": "support",
        "confidence": 0.9,
        "batch_id": 1,
        "user_id": "test_user_manual",
        "session_id": "manual_test_session"
    },
    {
        "image_name": "test_image_2.jpg",
        "target": "Test Target 2",
        "justification": "Test Justification 2",
        "stance": "against",
        "confidence": 0.8,
        "batch_id": 1,
        "user_id": "test_user_manual",
        "session_id": "manual_test_session"
    }
]

try:
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
