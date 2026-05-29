import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { Upload } from 'lucide-react'
import ProgressBar from '../components/ProgressBar'
import { analyzeQR } from '../utils/api'
import { addToHistory } from '../utils/history'

export default function Scanner() {
  const navigate = useNavigate()
  const scannerRef = useRef(null)
  const isRunningRef = useRef(false)
  const isProcessingRef = useRef(false)
  const fileInputRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // shared handler for any decoded QR text (camera or upload)
  async function handleDecoded(decodedText, qrInstance) {
    if (isProcessingRef.current) return
    isProcessingRef.current = true
    setError(null)
    setLoading(true)

    // stop camera if running
    if (isRunningRef.current && qrInstance) {
      try {
        await qrInstance.stop()
        isRunningRef.current = false
      } catch {
        // already stopped
      }
    }

    try {
      const result = await analyzeQR(decodedText)
      const entry = addToHistory({
        qr_content: decodedText,
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
      setError('Could not analyze QR code. Please try again.')
      setLoading(false)
      isProcessingRef.current = false

      // restart camera scan after upload error
      if (qrInstance && !isRunningRef.current) {
        const config = { fps: 10, qrbox: { width: 220, height: 220 }, aspectRatio: 1.0 }
        qrInstance.start({ facingMode: 'environment' }, config, () => {}, () => {})
          .then(() => { isRunningRef.current = true })
          .catch(() => {})
      }
    }
  }

  useEffect(() => {
    const qr = new Html5Qrcode('qr-reader')
    scannerRef.current = qr

    const config = {
      fps: 10,
      qrbox: { width: 220, height: 220 },
      aspectRatio: 1.0,
      disableFlip: false,
    }

    qr.start(
      { facingMode: 'environment' },
      config,
      (decodedText) => handleDecoded(decodedText, qr),
      () => { /* scan failure — ignore */ }
    ).then(() => {
      isRunningRef.current = true
    }).catch(() => {
      setError('Camera access denied. You can still upload a QR image below.')
    })

    return () => {
      qr.stop().catch(() => {})
      isRunningRef.current = false
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    // reset input so same file can be re-selected
    e.target.value = ''

    if (isProcessingRef.current) return

    setError(null)

    // use a fresh Html5Qrcode instance for file scanning (separate from camera instance)
    const reader = new Html5Qrcode('qr-file-reader')
    try {
      const decoded = await reader.scanFile(file, false)
      await reader.clear()
      handleDecoded(decoded, scannerRef.current)
    } catch {
      await reader.clear().catch(() => {})
      setError('No QR code found in this image. Try a clearer photo.')
    }
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      <ProgressBar visible={loading} />

      {/* header */}
      <div className="flex items-center px-5 pt-5 pb-3">
        <span className="font-serif text-2xl text-black tracking-tight" style={{ fontFamily: 'Instrument Serif, serif' }}>
          TrustQR
        </span>
      </div>

      {/* viewfinder */}
      <div className="relative flex-1 max-h-[60vh] bg-black overflow-hidden">
        <div id="qr-reader" style={{ width: '100%', height: '100%' }} />

        {/* frame overlay */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="relative" style={{ width: 220, height: 220 }}>
            <span className="absolute top-0 left-0 w-7 h-7 border-t-2 border-l-2 border-white" />
            <span className="absolute top-0 right-0 w-7 h-7 border-t-2 border-r-2 border-white" />
            <span className="absolute bottom-0 left-0 w-7 h-7 border-b-2 border-l-2 border-white" />
            <span className="absolute bottom-0 right-0 w-7 h-7 border-b-2 border-r-2 border-white" />
          </div>
        </div>
      </div>

      {/* hidden div required by html5-qrcode for file scanning */}
      <div id="qr-file-reader" style={{ display: 'none' }} />

      {/* tagline + upload */}
      <div className="flex flex-col items-center px-5 pt-4 pb-2 gap-3">
        <p className="text-sm text-center" style={{ color: '#999' }}>
          Think before you scan.
        </p>

        {/* divider */}
        <div className="flex items-center gap-3 w-full max-w-xs">
          <div className="flex-1 h-px bg-[#E5E5E5]" />
          <span className="text-xs text-[#999]">or</span>
          <div className="flex-1 h-px bg-[#E5E5E5]" />
        </div>

        {/* upload button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
          disabled={loading}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 border border-[#E5E5E5] text-sm text-black bg-white hover:bg-[#FAFAFA] active:bg-[#F5F5F5] transition-colors disabled:opacity-40"
        >
          <Upload size={14} color="#000" />
          Upload QR image
        </button>
      </div>

      {/* error */}
      {error && (
        <div className="mx-5 mt-2 px-4 py-3 border border-[#C73E1D] text-sm text-[#C73E1D]">
          {error}
        </div>
      )}

      {loading && (
        <div className="mx-5 mt-2 px-4 py-3 border border-[#E5E5E5] text-sm text-[#666] text-center">
          Analyzing QR code...
        </div>
      )}

      {/* bottom links */}
      <div className="flex justify-center gap-8 mt-auto pb-8 pt-4">
        <button
          onClick={() => navigate('/app/history')}
          className="text-sm text-black underline underline-offset-2 bg-transparent border-none cursor-pointer"
        >
          History
        </button>
        <button
          onClick={() => navigate('/app/about')}
          className="text-sm text-black underline underline-offset-2 bg-transparent border-none cursor-pointer"
        >
          About
        </button>
      </div>
    </div>
  )
}
