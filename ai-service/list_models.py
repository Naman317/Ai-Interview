from google import genai
import os
import sys
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API")

if not api_key:
    print("NO API KEY")
    sys.exit(1)

client = genai.Client(api_key=api_key)

try:
    print("Listing models...")
    models = client.models.list()
    for m in models:
        print(f"Name: {m.name}, Display: {m.display_name}")
except Exception as e:
    print("Error:", e)
