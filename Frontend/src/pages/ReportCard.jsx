import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import CheckRow from '../components/CheckRow'
import { flagQR } from '../utils/api'

const safetyConfig = {
  safe: {
    label: 'SAFE',
    dotColor: '#2D7A4F',
    borderColor: '#2D7A4F',
    actionText: 'Looks clean. You can proceed.',
  },
  caution: {
    label: 'CAUTION',
    dotColor: '#D4A017',
    borderColor: '#D4A017',
    actionText: 'Proceed carefully. Verify before acting.',
  },
  danger: {
    label: 'DANGER',
    dotColor: '#C73E1D',
    borderColor: '#C73E1D',
    actionText: 'Do not proceed. Close this immediately.',
  },
}

export default function ReportCard() {
  const location = useLocation()
  const navigate = useNavigate()
  const [flagged, setFlagged] = useState(false)
  const [flagging, setFlagging] = useState(false)

  const state = location.state
  if (!state || !state.result) {
    navigate('/app/choose')
    return null
  }

  const { scan, result } = state
  // WiFi QR codes are treated as plain text in the UI
  const isWifi = result.qr_type === 'wifi'
  const safety = isWifi ? 'caution' : (result.safety || 'caution')
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
      {/* backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.4)' }}
        onClick={() => navigate('/app/choose')}
      />

      {/* report card — no rounded corners, feels like a definitive report */}
      <div
        className="relative bg-white slide-up overflow-y-auto"
        style={{ maxHeight: '92vh' }}
      >
        {/* top accent bar — color-coded by safety */}
        <div style={{ height: 3, background: cfg.dotColor, width: '100%' }} />

        <div className="px-5 pb-8 pt-5">

          {/* status + verdict */}
          <div className="mb-5">
            {isWifi ? (
              <>
                <div className="flex items-center gap-2.5 mb-2">
                  <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#888888', flexShrink: 0 }} />
                  <span className="font-bold tracking-wide" style={{ fontSize: 42, color: '#000', lineHeight: 1, fontFamily: 'Inter, sans-serif', letterSpacing: '-0.5px' }}>
                    UNKNOWN
                  </span>
                </div>
                <p className="text-base text-black leading-snug mb-1">This QR contains network credentials.</p>
                <p className="text-sm" style={{ color: '#555555' }}>Unknown type. Review the content carefully.</p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2.5 mb-2">
                  <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: cfg.dotColor, flexShrink: 0 }} />
                  <span className="font-bold tracking-wide" style={{ fontSize: 42, color: '#000', lineHeight: 1, fontFamily: 'Inter, sans-serif', letterSpacing: '-0.5px' }}>
                    {cfg.label}
                  </span>
                </div>
                <p className="text-base text-black leading-snug mb-1">
                  {result.verdict || 'This QR code has been analyzed.'}
                </p>
                <p className="text-sm" style={{ color: '#555555' }}>
                  {cfg.actionText}
                </p>
              </>
            )}
          </div>

          {/* UPI direction — most important info for UPI scams */}
          {isUPI && upiInfo && (
            <div
              className="mb-5 px-4 py-4"
              style={(() => {
                // incoming (credit) is always green regardless of safety
                if (upiInfo.direction !== 'outgoing') {
                  return {
                    border: '1px solid #2D7A4F',
                    background: '#F0FFF6',
                  }
                }
                // outgoing — use safety level for color
                if (safety === 'safe') return { border: '1px solid #EEEEEE', background: '#FAFAFA' }
                if (safety === 'caution') return { border: '1px solid #D4A017', background: '#FFFDF0' }
                return { border: '1px solid #C73E1D', background: '#FFF5F3' }
              })()}
            >
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#999' }}>
                Money direction
              </p>
              <p className="font-bold text-black" style={{ fontSize: 20, lineHeight: 1.2 }}>
                Money will{' '}
                <span style={{ color: upiInfo.direction !== 'outgoing' ? '#2D7A4F' : (safety === 'safe' ? '#000000' : safety === 'caution' ? '#D4A017' : '#C73E1D') }}>
                  {upiInfo.direction === 'outgoing' ? 'LEAVE' : 'ENTER'}
                </span>{' '}
                your account
              </p>
              <div className="mt-3 flex flex-col gap-1">
                {upiInfo.payee_name && (
                  <p className="text-sm text-black">
                    <span className="text-[#666]">Payee: </span>{upiInfo.payee_name}
                  </p>
                )}
                {upiInfo.upi_id && (
                  <p className="text-sm text-black font-mono">
                    <span className="text-[#666] font-sans">ID: </span>{upiInfo.upi_id}
                  </p>
                )}
                {upiInfo.amount && (
                  <p className="text-sm font-semibold text-black">
                    Amount: ₹{upiInfo.amount}
                  </p>
                )}
              </div>
              {upiInfo.is_collect_request && (
                <p
                  className="text-xs font-semibold mt-3 px-2 py-1.5 uppercase tracking-wide"
                  style={{ background: '#C73E1D', color: '#fff' }}
                >
                  Collect request — this takes money from you
                </p>
              )}
            </div>
          )}

          {/* security checks */}
          {checks.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#999] mb-2">
                Security checks
              </p>
              <div style={{ border: '1px solid #E5E5E5' }}>
                <div className="px-4">
                  {checks.map((c, i) => (
                    <CheckRow key={i} label={c.label} passed={c.passed} value={c.value} warning={c.warning} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* actions */}
          <div className="flex gap-3 mb-5">
            <button
              onClick={() => navigate('/app/details', { state: { scan, result } })}
              className="flex-1 py-3 text-sm font-medium text-black bg-white transition-colors"
              style={{ border: '1px solid #000' }}
            >
              See Details
            </button>
            <button
              onClick={handleFlag}
              disabled={flagged || flagging}
              className="flex-1 py-3 text-sm font-medium text-white transition-opacity disabled:opacity-50"
              style={{ background: flagged ? '#666' : '#000', border: '1px solid #000' }}
            >
              {flagged ? 'Reported' : flagging ? 'Reporting...' : 'Report as Scam'}
            </button>
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => navigate('/app/choose')}
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
