const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
export const CHATBOT_URL = import.meta.env.VITE_CHATBOT_URL || 'https://trustqr-3692981377.us-central1.run.app'

export async function analyzeQR(qrContent) {
  const res = await fetch(`${API_URL}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ qr_content: qrContent }),
  })
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`)
  }
  return res.json()
}

export async function flagQR(qrContent) {
  const res = await fetch(`${API_URL}/api/flag`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ qr_content: qrContent }),
  })
  if (!res.ok) {
    throw new Error(`Flag API error: ${res.status}`)
  }
  return res.json()
}
