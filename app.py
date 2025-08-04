from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dotenv import load_dotenv
import os
import httpx

# Load .env
load_dotenv()
MURF_API_KEY = os.getenv("MURF_API_KEY")

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def read_index():
    return FileResponse("static/index.html")

class TextInput(BaseModel):
    text: str

@app.post("/generate-audio")
async def generate_audio(input: TextInput):
    headers = {
        "api-key": MURF_API_KEY,  
        "Content-Type": "application/json"
    }

    payload = {
        "text": input.text,
        "voice_id": "en-IN-aarav",  
        "output_format": "mp3"
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.murf.ai/v1/speech/generate",
            json=payload,
            headers=headers
        )
        print("Status:", response.status_code)
        print("Response:", response.text)

        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)
        
        return response.json()
