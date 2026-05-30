import os
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="TrustQR Chatbot")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")

SYSTEM_PROMPT = """You are TrustQR AI — an expert assistant specializing in QR code scam detection and digital safety in India.

You deeply understand:

PAYMENT SCAMS (UPI):
- Collect requests: scammers send QR codes that look like "receive money" but actually debit your account when you enter your UPI PIN
- Fake merchant QR codes: scammers paste their QR over legitimate shop QRs so payments go to them
- Pre-filled amount UPI QRs that show inflated amounts
- Fake charity/donation QR codes
- Common scam UPI patterns: random strings like abc123@ybl, numbers-only IDs, suspicious handles

URL/LINK SCAMS:
- Phishing sites mimicking HDFC, SBI, ICICI, Paytm, PhonePe, BHIM, Amazon, Flipkart
- Newly registered domains (under 30 days) are high risk
- URL shorteners (bit.ly, tinyurl) hiding the final destination
- Redirect chains bouncing through ad trackers before landing on phishing pages
- APK download links disguised as banking apps or government apps
- Domains with suspicious patterns: extra hyphens, misspellings, unusual TLDs (.xyz, .tk, .ml, .ga)
- Fake KYC update pages that steal Aadhaar/PAN details

WHATSAPP & SOCIAL MEDIA SCAMS:
- QR codes in WhatsApp messages claiming lottery prizes, job offers, bank KYC
- "Scan to verify your account" tricks
- Fake customer care QR codes
- Job offer QR codes leading to malware

WIFI QR CODES:
- Generally lower risk but can redirect devices to malicious networks
- Fake public WiFi QR codes

HOW TO ANALYZE QR CONTENT:
- UPI strings start with "upi://" — check pa= (UPI ID), pn= (payee name), am= (amount), mode= (collect vs pay)
- URLs — check domain age, HTTPS, redirects, known phishing patterns
- Always verify sender identity before scanning QR codes from unknown sources

ADVICE TO GIVE:
- Never enter UPI PIN to "receive" money — receiving money requires NO PIN
- Call the merchant/person directly to verify before paying via QR
- Use official apps to scan QRs, not random scanner apps
- Report scams to cybercrime.gov.in and call 1930 (National Cybercrime Helpline)
- If scammed: immediately call bank, file complaint on 1930, cybercrime.gov.in

When someone shares QR content, analyze it and give clear SAFE / CAUTION / DANGER verdict with explanation.
Be direct, practical, and use simple language. No jargon. Give actionable advice."""


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[Message]] = []
    scan_context: Optional[str] = None


class SpeakRequest(BaseModel):
    text: str


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/chat")
async def chat(req: ChatRequest):
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")

    client = OpenAI(api_key=OPENAI_API_KEY)

    system = SYSTEM_PROMPT
    if req.scan_context:
        system += f"\n\nUSER'S RECENT SCAN HISTORY (from their TrustQR app):\n{req.scan_context}\n\nUse this history to give personalized advice when relevant."

    messages = [{"role": "system", "content": system}]
    for msg in (req.history or []):
        messages.append({"role": msg.role, "content": msg.content})
    messages.append({"role": "user", "content": req.message})

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=600,
            temperature=0.4,
        )
        reply = response.choices[0].message.content
        return {"reply": reply}
    except Exception as openai_err:
        # fallback to Groq
        groq_key = os.getenv("GROQ_API_KEY", "")
        if not groq_key:
            raise HTTPException(status_code=500, detail=f"OpenAI error: {str(openai_err)}")
        try:
            groq_client = OpenAI(api_key=groq_key, base_url="https://api.groq.com/openai/v1")
            response = groq_client.chat.completions.create(
                model="llama3-8b-8192",
                messages=messages,
                max_tokens=600,
                temperature=0.4,
            )
            reply = response.choices[0].message.content
            return {"reply": reply}
        except Exception as groq_err:
            raise HTTPException(status_code=500, detail=f"Both OpenAI and Groq failed: {str(groq_err)}")


@app.post("/api/speak")
async def speak(req: SpeakRequest):
    if not ELEVENLABS_API_KEY:
        raise HTTPException(status_code=500, detail="ElevenLabs API key not configured")

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}/stream"
    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
    }
    payload = {
        "text": req.text,
        "model_id": "eleven_monolingual_v1",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75,
        },
    }

    async def audio_stream():
        async with httpx.AsyncClient(timeout=60) as client:
            async with client.stream("POST", url, json=payload, headers=headers) as r:
                if r.status_code != 200:
                    return
                async for chunk in r.aiter_bytes(chunk_size=4096):
                    yield chunk

    return StreamingResponse(
        audio_stream(),
        media_type="audio/mpeg",
        headers={"Cache-Control": "no-cache"},
    )
