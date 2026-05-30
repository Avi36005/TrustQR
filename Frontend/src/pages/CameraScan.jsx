import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import jsQR from 'jsqr'
import ProgressBar from '../components/ProgressBar'
import { analyzeQR } from '../utils/api'
import { addToHistory } from '../utils/history'

export default function CameraScan() {
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const animFrameRef = useRef(null)
  const processingRef = useRef(false)
  const [loading, setLoading] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)

  function stopCamera() {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }

  useEffect(() => {
    let mounted = true

    function scanLoop() {
      if (!mounted || processingRef.current) return
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
        animFrameRef.current = requestAnimationFrame(scanLoop)
        return
      }
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      })
      if (code && code.data) {
        processingRef.current = true
        stopCamera()
        handleDetected(code.data)
        return
      }
      animFrameRef.current = requestAnimationFrame(scanLoop)
    }

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        })
        if (!mounted) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          if (mounted) { setCameraReady(true); scanLoop() }
        }
      } catch {
        if (mounted) setPermissionDenied(true)
      }
    }

    startCamera()
    return () => { mounted = false; stopCamera() }
  }, []) // eslint-disable-line

  async function handleDetected(decoded) {
    setLoading(true)
    try {
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
    } catch {
      setLoading(false)
      processingRef.current = false
    }
  }

  function handleBack() {
    stopCamera()
    navigate('/app/choose')
  }

  if (permissionDenied) {
    return (
      <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Inter, sans-serif', padding: 24 }}>
        <button onClick={handleBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <ArrowLeft size={16} strokeWidth={1.5} color="#000" />
        </button>
        <div style={{ marginTop: 64, textAlign: 'center' }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 18, color: '#000', marginBottom: 8 }}>
            Camera access denied.
          </p>
          <p style={{ fontSize: 14, color: '#666', lineHeight: 1.6, marginBottom: 24 }}>
            Please allow camera permission in your browser settings.
          </p>
          <button
            onClick={() => navigate('/app/upload')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#000', textDecoration: 'underline' }}
          >
            Upload an image instead →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', background: '#000', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <ProgressBar visible={loading} />

      {/* back button */}
      <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 20, padding: '20px 16px' }}>
        <button
          onClick={handleBack}
          style={{ background: 'rgba(0,0,0,0.5)', border: 'none', cursor: 'pointer', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          aria-label="Back"
        >
          <ArrowLeft size={16} strokeWidth={1.5} color="#fff" />
        </button>
      </div>

      {/* viewfinder — 60vh */}
      <div style={{ position: 'relative', height: '60vh', background: '#000', overflow: 'hidden', flexShrink: 0 }}>
        <video
          ref={videoRef}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          playsInline
          muted
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* frame corners */}
        {cameraReady && !loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ width: 220, height: 220, position: 'relative' }}>
              <span style={{ position: 'absolute', top: 0, left: 0, width: 28, height: 28, borderTop: '2px solid #fff', borderLeft: '2px solid #fff', display: 'block' }} />
              <span style={{ position: 'absolute', top: 0, right: 0, width: 28, height: 28, borderTop: '2px solid #fff', borderRight: '2px solid #fff', display: 'block' }} />
              <span style={{ position: 'absolute', bottom: 0, left: 0, width: 28, height: 28, borderBottom: '2px solid #fff', borderLeft: '2px solid #fff', display: 'block' }} />
              <span style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderBottom: '2px solid #fff', borderRight: '2px solid #fff', display: 'block' }} />
            </div>
          </div>
        )}
      </div>

      {/* bottom white area */}
      <div style={{ flex: 1, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <p style={{ fontSize: 14, color: '#888888', fontFamily: 'Inter, sans-serif', textAlign: 'center', lineHeight: 1.6 }}>
          {loading ? 'Analyzing QR code...' : 'Point at a QR code to scan automatically'}
        </p>
      </div>
    </div>
  )
}
