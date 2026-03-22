import requests
import json
import time

# Give service time to start
time.sleep(2)

BASE_URL = "http://localhost:8000"

# Test endpoints
print("Testing AI Service Endpoints\n" + "="*50)

# Test 1: Docs endpoint
try:
    response = requests.get(f"{BASE_URL}/docs")
    print(f"✓ /docs - Status: {response.status_code}")
except Exception as e:
    print(f"✗ /docs - Error: {e}")

# Test 2: Generate Questions
try:
    payload = {
        "role": "Frontend Developer",
        "topic": "Frontend Development",
        "level": "Junior",
        "count": 3,
        "interview_type": "oral",
        "language": "English"
    }
    response = requests.post(f"{BASE_URL}/generate-questions", json=payload)
    print(f"✓ /generate-questions - Status: {response.status_code}")
    if response.status_code == 200:
        print(f"  Response has {len(response.json().get('questions', []))} questions")
except Exception as e:
    print(f"✗ /generate-questions - Error: {e}")

# Test 3: Generate Problem
try:
    payload = {
        "title": "Two Sum",
        "company": "Google"
    }
    response = requests.post(f"{BASE_URL}/generate-problem", json=payload)
    print(f"✓ /generate-problem - Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"  Description: {data.get('description', '')[:60]}...")
    else:
        print(f"  Response: {response.text[:200]}")
except Exception as e:
    print(f"✗ /generate-problem - Error: {e}")

print("\n" + "="*50)
print("Test complete!")
