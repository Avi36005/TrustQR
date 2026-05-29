# TrustQR Backend

A FastAPI backend for TrustQR — a QR code safety scanner for the Indian market.

## Features

- UPI QR code analysis (collect request detection, scam ID lookup, format validation)
- URL QR code analysis (Safe Browsing, URLhaus, domain age, brand lookalike detection)
- WiFi QR code analysis (security type, open network warnings)
- Community flagging system
- Rate limiting (30 requests/minute per IP)

## Setup

1. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/macOS
   venv\Scripts\activate     # Windows
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Copy and configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env and add your API keys
   ```

4. Run the server:
   ```bash
   uvicorn app.main:app --reload --port 8080
   ```

## API Endpoints

- `GET /api/health` — Health check
- `POST /api/analyze` — Analyze a QR code
- `POST /api/flag` — Flag a QR code as suspicious
- `GET /api/flag-count/{qr_hash}` — Get flag count for a QR hash

## Running Tests

```bash
pytest tests/ -v
```

## Docker

```bash
docker build -t trustqr-backend .
docker run -p 8080:8080 --env-file .env trustqr-backend
```
