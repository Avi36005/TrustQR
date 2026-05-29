# PreQR Backend

QR code safety scanner backend built with FastAPI + SQLAlchemy.

## Local Development

```bash
cd preqr-backend

# create virtualenv
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# install deps
pip install -r requirements.txt

# copy env file
cp .env.example .env
# edit .env as needed

# run dev server
uvicorn app.main:app --reload --port 8000
```

API docs available at `http://localhost:8000/docs`

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./preqr.db` | DB connection string |
| `ENVIRONMENT` | `development` | `development` or `production` |
| `CORS_ORIGIN` | *(none)* | Extra CORS origin (e.g. deployed frontend URL) |
| `GOOGLE_SAFE_BROWSING_API_KEY` | *(none)* | Google Safe Browsing API v4 key |

## API Endpoints

### `GET /api/health`
Returns `{"status": "ok"}`

### `POST /api/analyze`
Analyzes a QR code string.

**Request:**
```json
{ "qr_content": "upi://pay?pa=merchant@oksbi&pn=Shop" }
```

**Response:**
```json
{
  "safety": "safe",
  "qr_type": "upi",
  "verdict": "This upi QR code looks safe.",
  "details": {
    "checks": [{"label": "UPI ID format valid", "passed": true, "value": "merchant@oksbi"}],
    "upi_info": {"upi_id": "merchant@oksbi", "payee_name": "Shop", ...},
    "community_flags": 0
  }
}
```

### `POST /api/flag`
Flags a QR code as suspicious.

**Request:**
```json
{ "qr_content": "upi://pay?pa=scammer@ybl" }
```

**Response:**
```json
{ "success": true, "new_flag_count": 3 }
```

### `GET /api/flag-count/{qr_hash}`
Returns community flag count for a SHA-256 hashed QR.

**Response:**
```json
{ "qr_hash": "abc123...", "flag_count": 3 }
```

## Running Tests

```bash
pip install pytest
pytest tests/ -v
```

## GCP Cloud Run Deployment

**Project:** mediflow-nexus-2026  
**Service:** trustqr  
**Region:** asia-south1

```bash
# Authenticate
gcloud auth login avinashgehi3@gmail.com
gcloud config set project mediflow-nexus-2026

# Build and push image
gcloud builds submit --tag gcr.io/mediflow-nexus-2026/trustqr .

# Deploy to Cloud Run
gcloud run deploy trustqr \
  --image gcr.io/mediflow-nexus-2026/trustqr \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars ENVIRONMENT=production \
  --set-env-vars DATABASE_URL=<YOUR_POSTGRES_URL> \
  --set-env-vars CORS_ORIGIN=<YOUR_FRONTEND_URL>
```

### Using Cloud SQL (PostgreSQL)

1. Create a Cloud SQL PostgreSQL instance in `asia-south1`
2. Set `DATABASE_URL` to the connection string:
   ```
   postgresql+psycopg2://user:password@/dbname?host=/cloudsql/mediflow-nexus-2026:asia-south1:INSTANCE_NAME
   ```
3. Add `--add-cloudsql-instances mediflow-nexus-2026:asia-south1:INSTANCE_NAME` to the deploy command

## Architecture

```
QR content → type detection → analyzer (upi/url/wifi/text)
                                    ↓
                           external checks (WHOIS, Safe Browsing, URLhaus)
                                    ↓
                           safety scorer → safe / caution / danger
```
