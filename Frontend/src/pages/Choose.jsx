import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import jsQR from 'jsqr'
import { analyzeQR } from '../utils/api'
import { addToHistory } from '../utils/history'

function decodeQRFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        canvas.getContext('2d').drawImage(img, 0, 0)
        const imageData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' })
        if (code && code.data) resolve(code.data)
        else reject(new Error('No QR code found in this image. Please try another.'))
      }
      img.onerror = () => reject(new Error('Could not load image.'))
      img.src = e.target.result
    }
    reader.onerror = () => reject(new Error('Could not read file.'))
    reader.readAsDataURL(file)
  })
}

export default function Choose() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [status, setStatus] = useState('idle') // idle | loading | error
  const [errorMsg, setErrorMsg] = useState('')

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setStatus('loading')
    setErrorMsg('')

    try {
      const decoded = await decodeQRFromFile(file)
      const result = await analyzeQR(decoded)
      const entry = addToHistory({
        qr_content: decoded,
        qr_type: result.qr_type || 'unknown',
        safety: result.safety,
        verdict: result.verdict,
        details: result.details || {},
      })
      if (result.safety === 'danger' && navigator.vibrate) navigator.vibrate(200)
      navigate('/app/report', { state: { scan: entry, result } })
    } catch (err) {
      setErrorMsg(err.message || 'No QR code found.')
      setStatus('error')
    }
  }

  // Loading screen
  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', paddingBottom: 52 }}>
        <p style={{ fontSize: 15, color: '#888888', marginBottom: 8 }}>Reading QR code...</p>
        <p style={{ fontSize: 13, color: '#AAAAAA' }}>Analyzing...</p>
      </div>
    )
  }

  // Error screen
  if (status === 'error') {
    return (
      <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', padding: '0 24px', paddingBottom: 52, textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 22, color: '#000', marginBottom: 12 }}>No QR code found</h1>
        <p style={{ fontSize: 14, color: '#888888', marginBottom: 32, lineHeight: 1.6 }}>
          We couldn't find a QR code in this image. Please try another.
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{ padding: '14px 28px', background: '#000', color: '#fff', border: 'none', borderRadius: 0, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 500, marginBottom: 16 }}
        >
          Try Again
        </button>
        <button
          onClick={() => setStatus('idle')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#888888', fontFamily: 'Inter, sans-serif' }}
        >
          ← Back
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
      </div>
    )
  }

  // Default choice screen
  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Inter, sans-serif', paddingBottom: 52 }}>
      <div style={{ padding: '24px 24px 0' }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }} aria-label="Back">
          <ArrowLeft size={16} strokeWidth={1.5} color="#000" />
        </button>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '48px 24px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: 'calc(100vh - 80px)', justifyContent: 'center' }}>
        <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 28, color: '#000', marginBottom: 8, textAlign: 'center', lineHeight: 1.2 }}>
          How do you want to scan?
        </h1>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: '#888888', marginBottom: 48, textAlign: 'center', lineHeight: 1.6 }}>
          Choose an option to check your QR code
        </p>

        <div style={{ display: 'flex', gap: 12, width: '100%', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/app/scan')}
            style={{ flex: 1, minWidth: 140, background: '#000', color: '#fff', border: 'none', borderRadius: 0, padding: '18px 16px', cursor: 'pointer', textAlign: 'center' }}
            onMouseEnter={e => e.currentTarget.style.background = '#222'}
            onMouseLeave={e => e.currentTarget.style.background = '#000'}
          >
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 500, fontSize: 15, color: '#fff' }}>Scan with Camera</div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#999', marginTop: 6 }}>Point your camera at a QR code</div>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            style={{ flex: 1, minWidth: 140, background: '#000', color: '#fff', border: 'none', borderRadius: 0, padding: '18px 16px', cursor: 'pointer', textAlign: 'center' }}
            onMouseEnter={e => e.currentTarget.style.background = '#222'}
            onMouseLeave={e => e.currentTarget.style.background = '#000'}
          >
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 500, fontSize: 15, color: '#fff' }}>Upload Image</div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#999', marginTop: 6 }}>Upload a saved QR code image</div>
          </button>
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />

        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#AAAAAA', marginTop: 24, textAlign: 'center' }}>
          No account needed. Nothing is stored.
        </p>
      </div>
    </div>
  )
}
