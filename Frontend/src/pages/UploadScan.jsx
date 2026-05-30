import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import jsQR from 'jsqr'
import ProgressBar from '../components/ProgressBar'
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
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        })
        if (code && code.data) {
          resolve(code.data)
        } else {
          reject(new Error('No QR code found in this image. Please try another image.'))
        }
      }
      img.onerror = () => reject(new Error('Could not load image.'))
      img.src = e.target.result
    }
    reader.onerror = () => reject(new Error('Could not read file.'))
    reader.readAsDataURL(file)
  })
}

export default function UploadScan() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [preview, setPreview] = useState(null)

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setError(null)
    setLoading(true)
    setPreview(URL.createObjectURL(file))

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
      setError(err.message || 'No QR code found. Please try another image.')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Inter, sans-serif' }}>
      <ProgressBar visible={loading} />

      <div style={{ padding: '24px 24px 0' }}>
        <button
          onClick={() => navigate('/app/choose')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          aria-label="Back"
        >
          <ArrowLeft size={16} strokeWidth={1.5} color="#000" />
        </button>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '40px 24px 48px' }}>
        <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 24, color: '#000', marginBottom: 8, lineHeight: 1.2 }}>
          Upload a QR code image
        </h1>
        <p style={{ fontSize: 14, color: '#888888', marginBottom: 32, lineHeight: 1.6 }}>
          Select a saved QR code image from your device
        </p>

        {/* upload area */}
        <div
          onClick={() => !loading && fileInputRef.current?.click()}
          style={{
            border: '1px dashed #CCCCCC',
            borderRadius: 0,
            padding: 48,
            textAlign: 'center',
            cursor: loading ? 'default' : 'pointer',
            background: '#fff',
            minHeight: 180,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {preview ? (
            <>
              <img
                src={preview}
                alt="Selected QR"
                style={{ maxWidth: 200, maxHeight: 200, objectFit: 'contain', marginBottom: 8 }}
              />
              {loading && (
                <p style={{ fontSize: 14, color: '#888888', fontFamily: 'Inter, sans-serif' }}>
                  Reading QR code...
                </p>
              )}
            </>
          ) : (
            <>
              <p style={{ fontSize: 15, fontFamily: 'DM Sans, sans-serif', fontWeight: 500, color: '#000', margin: 0 }}>
                Tap to select image
              </p>
              <p style={{ fontSize: 12, color: '#888888', margin: 0 }}>
                JPG, PNG, GIF supported
              </p>
            </>
          )}
        </div>

        {error && (
          <p style={{ fontSize: 13, color: '#C73E1D', marginTop: 16, lineHeight: 1.6 }}>
            {error}
          </p>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFile}
        />
      </div>
    </div>
  )
}
