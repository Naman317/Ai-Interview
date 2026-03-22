import requests

try:
    resp = requests.post(
        "http://localhost:8000/generate-problem",
        json={"title": "Two Sum", "company": "Google"},
        timeout=5
    )
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.text[:300]}")
except requests.exceptions.ConnectionError:
    print("ERROR: Cannot connect to http://localhost:8000")
except Exception as e:
    print(f"ERROR: {e}")
