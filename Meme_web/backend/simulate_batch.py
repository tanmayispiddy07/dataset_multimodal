import requests
import uuid
import time
import json

def simulate_batch_submission():
    url = "http://localhost:8000/api/submit_batch"
    batch_size = 1174
    
    print(f"Generating {batch_size} dummy responses...")
    
    responses = []
    session_id = str(uuid.uuid4())
    
    for i in range(batch_size):
        response = {
            "image_name": f"img_{i}.png",
            "target": "Test Target",
            "target_specified": None,
            "justification": "This is a test justification to simulate payload size.",
            "stance": "Support",
            "confidence": 0.85,
            "batch_id": 1,
            "user_id": "load_test_user",
            "session_id": session_id
        }
        responses.append(response)
        
    payload_size_mb = len(json.dumps(responses)) / (1024 * 1024)
    print(f"Payload size: {payload_size_mb:.2f} MB")
    
    print("Sending request...")
    start_time = time.time()
    
    try:
        res = requests.post(url, json=responses)
        end_time = time.time()
        
        print(f"Status Code: {res.status_code}")
        print(f"Response: {res.text}")
        print(f"Time Taken: {end_time - start_time:.2f} seconds")
        
        if res.status_code == 200:
            print("SUCCESS: Batch submitted successfully.")
        else:
            print("FAILURE: Batch submission failed.")
            
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    simulate_batch_submission()
