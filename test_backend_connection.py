import requests

print("Testing Backend Connection...\n")

try:
    resp = requests.get('http://localhost:5001', timeout=2)
    print(f'✓ Backend root: {resp.status_code}')
except Exception as e:
    print(f'✗ Backend root: {str(e)[:50]}')

try:
    resp = requests.get('http://localhost:5001/api/sessions', timeout=2)
    print(f'✓ Backend /api/sessions: {resp.status_code}')
except Exception as e:
    print(f'✗ Backend /api/sessions: {str(e)[:50]}')

try:
    resp = requests.options('http://localhost:5001/api/sessions', timeout=2)
    print(f'✓ CORS preflight: {resp.status_code}')
    allow_origin = resp.headers.get('Access-Control-Allow-Origin', 'NOT SET')
    print(f'  Allow-Origin: {allow_origin}')
except Exception as e:
    print(f'✗ CORS: {str(e)[:50]}')

print("\nIf all tests show responses, backend is working.")
print("If ERR_INTERNET_DISCONNECTED persists, may be a Vite/CORS issue.")
