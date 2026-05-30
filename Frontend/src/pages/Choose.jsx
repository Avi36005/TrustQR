import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'
import ProgressBar from '../components/ProgressBar'
import { analyzeQR } from '../utils/api'
import { addToHistory } from '../utils/history'

export default function Choose() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setLoading(true)
    setError(null)

    const reader = new Html5Qrcode('qr-choose-reader')
    try {
      const decoded = await reader.scanFile(file, false)
      await reader.clear()

      const result = await analyzeQR(decoded)
      const entry = addToHistory({
        qr_content: decoded,
        qr_type: result.qr_type || 'unknown',
        safety: result.safety,
        verdict: result.verdict,
        details: result.details || {},
      })

      if (result.safety === 'danger' && navigator.vibrate) {
        navigator.vibrate(200)
      }

      navigate('/app/report', { state: { scan: entry, result } })
    } catch {
      await reader.clear().catch(() => {})
      setError('No QR code found in this image. Try a clearer photo.')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Inter, sans-serif' }}>
      <ProgressBar visible={loading} />

      {/* back arrow */}
      <div style={{ padding: '24px 24px 0' }}>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          aria-label="Back to home"
        >
          <ArrowLeft size={16} strokeWidth={1.5} color="#000" />
        </button>
      </div>

      {/* centered content */}
      <div style={{
        maxWidth: 480,
        margin: '0 auto',
        padding: '48px 24px 48px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: 'calc(100vh - 60px)',
        justifyContent: 'center',
      }}>
        <h1 style={{
          fontFamily: 'DM Sans, sans-serif',
          fontWeight: 700,
          fontSize: 28,
          color: '#000',
          marginBottom: 8,
          textAlign: 'center',
          lineHeight: 1.2,
        }}>
          How do you want to scan?
        </h1>
        <p style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 15,
          color: '#888888',
          marginBottom: 48,
          textAlign: 'center',
          lineHeight: 1.6,
        }}>
          Choose an option to check your QR code
        </p>

        {/* two buttons */}
        <div style={{
          display: 'flex',
          gap: 12,
          width: '100%',
          flexDirection: 'row',
        }}>
          {/* Scan with Camera */}
          <button
            onClick={() => navigate('/app')}
            style={{
              flex: 1,
              background: '#000',
              color: '#fff',
              border: 'none',
              borderRadius: 0,
              padding: '18px 16px',
              cursor: 'pointer',
              textAlign: 'center',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#222'}
            onMouseLeave={e => e.currentTarget.style.background = '#000'}
          >
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 500, fontSize: 15, color: '#fff' }}>
              Scan with Camera
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#999', marginTop: 6 }}>
              Point your camera at a QR code
            </div>
          </button>

          {/* Upload Image */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            style={{
              flex: 1,
              background: '#000',
              color: '#fff',
              border: 'none',
              borderRadius: 0,
              padding: '18px 16px',
              cursor: loading ? 'not-allowed' : 'pointer',
              textAlign: 'center',
              opacity: loading ? 0.6 : 1,
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#222' }}
            onMouseLeave={e => e.currentTarget.style.background = '#000'}
          >
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 500, fontSize: 15, color: '#fff' }}>
              {loading ? 'Analyzing...' : 'Upload Image'}
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#999', marginTop: 6 }}>
              Upload a saved QR code image
            </div>
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />
        <div id="qr-choose-reader" style={{ display: 'none' }} />

        <p style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 12,
          color: '#AAAAAA',
          marginTop: 24,
          textAlign: 'center',
        }}>
          No account needed. Nothing is stored.
        </p>

        {error && (
          <p style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 13,
            color: '#C73E1D',
            marginTop: 16,
            textAlign: 'center',
          }}>
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
