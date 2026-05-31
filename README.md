<div align="center">

# TrustQR

**Know what a QR code does before you scan it.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-trustqr--web-black?style=for-the-badge&logo=google-cloud&logoColor=white)](https://trustqr-web-3692981377.asia-south1.run.app)
[![Hackathon](https://img.shields.io/badge/Codorra%202026-Hackathon-FF6B35?style=for-the-badge)](https://trustqr-web-3692981377.asia-south1.run.app)
[![Made for India](https://img.shields.io/badge/Made%20for-India%20🇮🇳-138808?style=for-the-badge)](https://trustqr-web-3692981377.asia-south1.run.app)

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![Google Cloud Run](https://img.shields.io/badge/Cloud%20Run-asia--south1-4285F4?style=flat-square&logo=google-cloud)](https://cloud.google.com/run)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991?style=flat-square&logo=openai)](https://openai.com)
[![ElevenLabs](https://img.shields.io/badge/ElevenLabs-Voice%20AI-000000?style=flat-square)](https://elevenlabs.io)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)

QR code scams are the fastest-growing digital fraud in India.  
TrustQR analyzes any QR code in under 2 seconds — UPI, URLs, WiFi — and tells you if it's safe.

</div>

---

## The Problem

Scammers in India exploit QR codes in three major ways:

- **UPI collect requests** — look like "receive money" but drain your account when you enter your PIN
- **Phishing URLs** — HDFC, SBI, Paytm lookalike sites that steal your banking credentials  
- **Merchant QR replacement** — criminals paste fake QR codes over shop payment codes

There is no way to know what a QR code contains until you scan it. **TrustQR lets you check first.**

---

## Connection to the Theme: Mass Surveillance vs. Public Safety

TrustQR explores the fine line between **protecting society (Public Safety)** and **preserving individual autonomy (Personal Privacy)** in a hyperconnected digital world. It does this through three core principles:

* **Empowering Individual Autonomy & Preventing Digital Profiling**: QR codes are the gateways of the physical-digital intersection. Scanning a QR code blindly forces users to interact with unknown servers, exposing them to silent redirects, IP logging, device fingerprinting, and malicious APK downloads. TrustQR provides **transparency and control**, letting users audit the target destination *before* exposing their digital identities or device footprints.
* **Privacy-First, Zero-Surveillance Architecture**: While centralized databases tracking user scans could technically flag scams, they create a new mass surveillance vector by tracking where, when, and what individuals scan. TrustQR rejects this paradigm: all scan history is kept strictly client-side via `localStorage`. The platform checks threats without profiling the user.
* **Community-Driven Public Safety (Bottom-Up vs. Top-Down)**: Instead of relying on intrusive, top-down state/corporate monitoring to police digital spaces, TrustQR utilizes a decentralized, community-powered model. Users can anonymously flag fraudulent QR codes, contributing to a shared, crowd-sourced blacklist that protects the wider public without compromising anyone's individual privacy rights.

---

## Live Demo

| Service | URL |
|---|---|
| **Main Website** | https://trustqr-web-3692981377.asia-south1.run.app |
| **Backend API** | https://trustqr-api-3692981377.asia-south1.run.app/docs |
| **AI Chatbot** | https://trustqr-3692981377.asia-south1.run.app/docs |

---

## Features

### QR Analysis
- **Camera scan** — point and scan in real time
- **Image upload** — upload a saved QR code from gallery
- **SAFE / CAUTION / DANGER** verdict in under 2 seconds

### Security Checks
| Check | What it does |
|---|---|
| Google Safe Browsing | Checks against Google's live phishing/malware database |
| URLhaus | Checks active malware URLs from abuse.ch |
| UPI collect request detection | Detects mode=02 collect requests that drain your account |
| Known scam UPI ID database | Matches against 30+ reported scam UPI IDs |
| Phishing domain database | 20+ known Indian banking phishing domains |
| Brand impersonation | Catches hdfc-, sbi-, paytm- lookalike domains |
| Domain age (WHOIS) | Flags domains under 30 days old |
| Redirect chain | Follows short URLs to reveal final destination |
| APK download detection | Flags QR codes linking to Android app installs |
| Transaction note analysis | Flags suspicious keywords like "KYC", "refund", "lottery" |

### TrustQR AI — Voice Chatbot
- **Deep QR scam analysis** — paste any QR content for instant expert advice
- **Voice auto-plays** — AI responses spoken aloud automatically via ElevenLabs
- **Mic input** — speak your question instead of typing
- **History-aware** — chatbot knows your recent scan history and gives personalized advice
- **Groq fallback** — if OpenAI is down, switches to Llama3 automatically
- **Scan history sync** — synced with your local scan history

### Community
- **Flag scams** — report suspicious QR codes
- **Community feed** — see QR codes flagged by other users
- **Scan statistics** — live counter of total scans and reports

---

## Tech Stack

### Frontend
- **React 18** + Vite — fast, modern UI
- **Tailwind CSS v4** — utility-first styling
- **React Router** — client-side navigation
- **jsQR / html5-qrcode** — QR code decoding
- **Web Speech API** — voice input (mic button)
- **MediaSource API** — streaming audio playback

### Backend (QR Analysis API)
- **FastAPI** — async Python REST API
- **SQLAlchemy** + SQLite — scan history, community flags, scam database
- **Google Safe Browsing API** — live threat detection
- **URLhaus API** — malware/phishing URL database
- **python-whois** — domain age verification
- **tldextract** — domain extraction and analysis
- **slowapi** — rate limiting

### AI Chatbot Service
- **FastAPI** — lightweight microservice
- **OpenAI GPT-4o-mini** — QR scam expert chat with deep India context
- **ElevenLabs eleven_turbo_v2_5** — ultra-low latency voice synthesis
- **Groq Llama3** — automatic fallback if OpenAI fails

### Infrastructure
- **Google Cloud Run** — serverless containers, `asia-south1` (Mumbai)
- **Google Cloud Build** — CI/CD image builds
- **Google Container Registry** — Docker image storage
- **Google Safe Browsing API** — threat intelligence

---

## Architecture

```
Browser
  ├── React Frontend (trustqr-web · Cloud Run · Mumbai)
  │     ├── POST /api/analyze  ──► FastAPI Backend (trustqr-api · Cloud Run · Mumbai)
  │     │                               ├── Google Safe Browsing API
  │     │                               ├── URLhaus API
  │     │                               ├── WHOIS lookup
  │     │                               └── SQLite (scam DB + community flags)
  │     │
  │     └── POST /api/chat     ──► AI Chatbot (trustqr · Cloud Run · Mumbai)
  │         POST /api/speak          ├── OpenAI GPT-4o-mini
  │                                  ├── Groq Llama3 (fallback)
  │                                  └── ElevenLabs Turbo TTS (streaming)
  │
  └── localStorage (scan history — private, never uploaded)
```

---

## Running Locally

```bash
# Clone
git clone https://github.com/Avi36005/TrustQR
cd TrustQR

# Backend
cd backend
cp .env.example .env        # add your API keys
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Chatbot
cd ../chatbot
cp .env.example .env        # add OpenAI + ElevenLabs keys
pip install -r requirements.txt
uvicorn main:app --reload --port 8001

# Frontend
cd ../Frontend
cp .env.example .env        # set VITE_API_URL and VITE_CHATBOT_URL
npm install
npm run dev
```

### Environment Variables

**backend/.env**
```
GOOGLE_SAFE_BROWSING_API_KEY=your_key
OPENAI_API_KEY=your_key
GROQ_API_KEY=your_key
```

**chatbot/.env**
```
OPENAI_API_KEY=your_key
ELEVENLABS_API_KEY=your_key
GROQ_API_KEY=your_key
```

**Frontend/.env**
```
VITE_API_URL=http://localhost:8000
VITE_CHATBOT_URL=http://localhost:8001
```

---

## Test QR Codes

Ready-made test QR images are in [`test_qrs/`](./test_qrs/) — upload them to verify detection:

| File | Expected Result | Why |
|---|---|---|
| `TEST_DANGER_collect_scam.png` | 🔴 DANGER | UPI collect request + suspicious transaction note |
| `TEST_DANGER_known_scam_upi.png` | 🔴 DANGER | UPI ID matches scam database |
| `TEST_DANGER_hdfc_phishing.png` | 🔴 DANGER | Brand impersonation + suspicious TLD |
| `TEST_DANGER_sbi_phishing.png` | 🔴 DANGER | Known phishing domain |
| `TEST_CAUTION_shorturl.png` | 🟡 CAUTION | URL shortener hiding destination |
| `TEST_SAFE_legit_upi.png` | 🟢 SAFE | Clean UPI payment |
| `TEST_SAFE_legit_url.png` | 🟢 SAFE | Legitimate HTTPS URL |

---

## Team

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/Hardik182005">
        <img src="https://github.com/Hardik182005.png" width="80" style="border-radius:50%"/><br/>
        <b>Hardik</b>
      </a><br/>
      <sub>Frontend · Backend · Deployment</sub>
    </td>
    <td align="center">
      <a href="https://github.com/Avi36005">
        <img src="https://github.com/Avi36005.png" width="80" style="border-radius:50%"/><br/>
        <b>Avinash</b>
      </a><br/>
      <sub>AI · Voice · Infrastructure</sub>
    </td>
  </tr>
</table>

---

## Hackathon

Built for **Codorra 2026 Hackathon**

> *QR code scams cost Indians ₹1,800+ crore annually. We built TrustQR in under 48 hours to fight back.*

---

<div align="center">

**TrustQR** · Codorra 2026 · Made in India 🇮🇳

[Live Demo](https://trustqr-web-3692981377.asia-south1.run.app) · [API Docs](https://trustqr-api-3692981377.asia-south1.run.app/docs) · [Report Issue](https://github.com/Avi36005/TrustQR/issues)

</div>
