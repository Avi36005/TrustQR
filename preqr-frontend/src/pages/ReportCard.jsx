import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Check, X, AlertTriangle, ArrowRight } from 'lucide-react'
import CheckRow from '../components/CheckRow'
import SafetyDot from '../components/SafetyDot'
import { flagQR } from '../utils/api'

const safetyConfig = {
  safe: {
    label: 'SAFE',
    color: '#2D7A4F',
    bg: '#F0FAF4',
  },
  caution: {
    label: 'CAUTION',
    color: '#D4A017',
    bg: '#FFFBF0',
  },
  danger: {
    label: 'DANGER',
    color: '#C73E1D',
    bg: '#FFF5F3',
  },
}

export default function ReportCard() {
  const location = useLocation()
  const navigate = useNavigate()
  const [flagged, setFlagged] = useState(false)
  const [flagging, setFlagging] = useState(false)

  const state = location.state
  if (!state || !state.result) {
    navigate('/')
    return null
  }

  const { scan, result } = state
  const safety = result.safety || 'caution'
  const cfg = safetyConfig[safety] || safetyConfig.caution
  const checks = result.details?.checks || []
  const upiInfo = result.details?.upi_info
  const isUPI = result.qr_type === 'upi'

  async function handleFlag() {
    if (flagged || flagging) return
    setFlagging(true)
    try {
      await flagQR(scan.qr_content)
      setFlagged(true)
    } catch {
      // fail silently
    } finally {
      setFlagging(false)
    }
  }

  return (
    <div className="fixed inset-0 flex flex-col justify-end z-40" style={{ maxWidth: 480, margin: '0 auto' }}>
      {/* dim backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-30"
        onClick={() => navigate('/')}
      />

      {/* card */}
      <div
        className="relative bg-white slide-up rounded-t-2xl overflow-y-auto"
        style={{ maxHeight: '90vh' }}
      >
        {/* drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-[#E5E5E5] rounded-full" />
        </div>

        <div className="px-5 pb-8">
          {/* safety header */}
          <div className="flex items-center gap-3 mt-4 mb-2">
            <SafetyDot safety={safety} size={14} />
            <span
              className="font-bold"
              style={{ fontSize: 48, color: '#000', lineHeight: 1, fontFamily: 'Inter, sans-serif' }}
            >
              {cfg.label}
            </span>
          </div>

          {/* verdict */}
          <p className="text-base text-black mb-5" style={{ lineHeight: 1.5 }}>
            {result.verdict || 'This QR code has been analyzed.'}
          </p>

          {/* UPI direction banner */}
          {isUPI && upiInfo && (
            <div
              className="border border-[#E5E5E5] px-4 py-4 mb-5"
              style={{ background: '#FAFAFA' }}
            >
              <p className="text-base font-semibold text-black leading-snug">
                Money will{' '}
                <span style={{ color: upiInfo.direction === 'outgoing' ? '#C73E1D' : '#2D7A4F' }}>
                  {upiInfo.direction === 'outgoing' ? 'LEAVE' : 'COME TO'}
                </span>{' '}
                your account
              </p>
              {upiInfo.payee_name && (
                <p className="text-sm text-[#666] mt-1">
                  Payee: {upiInfo.payee_name}
                </p>
              )}
              {upiInfo.upi_id && (
                <p className="text-sm text-[#666]">
                  UPI ID: {upiInfo.upi_id}
                </p>
              )}
              {upiInfo.amount && (
                <p className="text-sm font-medium text-black mt-1">
                  Amount: ₹{upiInfo.amount}
                </p>
              )}
              {upiInfo.is_collect_request && (
                <p className="text-sm text-[#C73E1D] mt-1 font-medium">
                  This is a collect request — do not pay without verification
                </p>
              )}
            </div>
          )}

          {/* checks */}
          {checks.length > 0 && (
            <div className="border border-[#E5E5E5] px-4 mb-5">
              {checks.map((c, i) => (
                <CheckRow key={i} label={c.label} passed={c.passed} value={c.value} />
              ))}
            </div>
          )}

          {/* action buttons */}
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => navigate('/details', { state: { scan, result } })}
              className="flex-1 py-3 border border-black text-sm font-medium text-black bg-white active:bg-gray-100 transition-colors"
            >
              See Details
            </button>
            <button
              onClick={handleFlag}
              disabled={flagged || flagging}
              className="flex-1 py-3 border border-black text-sm font-medium text-white active:opacity-80 transition-opacity disabled:opacity-50"
              style={{ background: flagged ? '#666' : '#000' }}
            >
              {flagged ? 'Reported' : flagging ? 'Reporting...' : 'Report as Scam'}
            </button>
          </div>

          {/* scan again */}
          <div className="flex justify-center">
            <button
              onClick={() => navigate('/')}
              className="text-sm text-black underline underline-offset-2 bg-transparent border-none cursor-pointer"
            >
              Scan Again
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
