from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from fastapi import UploadFile, File
import os
import httpx
import shutil
import assemblyai as aai
from fastapi import UploadFile, File

load_dotenv()

aai.settings.api_key = os.getenv("ASSEMBLYAI_API_KEY")
transcriber = aai.Transcriber()

MURF_API_KEY = os.getenv("MURF_API_KEY")


app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    
@app.post("/transcribe/file")
async def transcribe_audio(audio: UploadFile = File(...)):
    try:
        audio_data = await audio.read()
        transcript = transcriber.transcribe(audio_data)
        return {"transcription": transcript.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
        
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/upload-audio")
async def upload_audio(audio: UploadFile = File(...)):
    try:
        file_location = os.path.join(UPLOAD_DIR, audio.filename)

        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(audio.file, buffer)

        return {
            "filename": audio.filename,
            "content_type": audio.content_type,
            "size": os.path.getsize(file_location)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    return response.json()
