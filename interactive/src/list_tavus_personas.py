
import os
import requests
from dotenv import load_dotenv

load_dotenv(".env.local")

api_key = os.getenv("TAVUS_API_KEY")

if not api_key:
    print("Error: TAVUS_API_KEY not found in .env.local")
    exit(1)

url = "https://tavusapi.com/v2/personas"

headers = {
    "x-api-key": api_key
}

try:
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    personas = response.json().get("data", [])
    
    print(f"Found {len(personas)} personas:")
    for persona in personas:
        print(f"ID: {persona.get('persona_id')} | Name: {persona.get('persona_name')}")

except requests.exceptions.HTTPError as e:
    print(f"HTTP Error: {e}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
