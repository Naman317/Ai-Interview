import requests
import json

BASE_AI = "http://localhost:8000"
BASE_BACKEND = "http://localhost:5001"

print("\n" + "="*70)
print("TESTING AI INTERVIEWER COMPLETE WORKFLOW")
print("="*70)

# Test 1: Generate Questions
print("\n[1] Testing Question Generation...")
try:
    resp = requests.post(f"{BASE_AI}/generate-questions", 
        json={
            "role": "Frontend Developer",
            "topic": "Frontend Development",
            "level": "Junior",
            "count": 3,
            "interview_type": "oral",
            "language": "English"
        },
        timeout=10
    )
    if resp.status_code == 200:
        data = resp.json()
        print(f"    ✓ Generated {len(data.get('questions', []))} questions")
        print(f"    Sample: {data['questions'][0][:60]}...")
    else:
        print(f"    ✗ Failed with status {resp.status_code}")
except Exception as e:
    print(f"    ✗ Error: {str(e)[:50]}")

# Test 2: Generate Problem
print("\n[2] Testing Coding Problem Generation...")
try:
    resp = requests.post(f"{BASE_AI}/generate-problem",
        json={"title": "Two Sum", "company": "Google"},
        timeout=10
    )
    if resp.status_code == 200:
        data = resp.json()
        print(f"    ✓ Problem generated successfully")
        print(f"    Description: {data.get('description', '')[:60]}...")
    else:
        print(f"    ✗ Failed with status {resp.status_code}: {resp.text[:100]}")
except Exception as e:
    print(f"    ✗ Error: {str(e)[:50]}")

# Test 3: Evaluate Answer
print("\n[3] Testing Answer Evaluation...")
try:
    resp = requests.post(f"{BASE_AI}/evaluate",
        json={
            "question": "What is JavaScript?",
            "question_type": "oral",
            "role": "Frontend Developer",
            "level": "Junior",
            "user_answer": "JavaScript is a programming language used for web development",
            "user_code": ""
        },
        timeout=10
    )
    if resp.status_code == 200:
        data = resp.json()
        print(f"    ✓ Evaluation complete")
        print(f"    Technical Score: {data.get('technicalScore')}/100")
        print(f"    Confidence Score: {data.get('confidenceScore')}/100")
        print(f"    Feedback: {data.get('aiFeedback', '')[:50]}...")
    else:
        print(f"    ✗ Failed with status {resp.status_code}: {resp.text[:100]}")
except Exception as e:
    print(f"    ✗ Error: {str(e)[:50]}")

print("\n" + "="*70)
print("WORKFLOW TEST COMPLETE")
print("="*70 + "\n")
