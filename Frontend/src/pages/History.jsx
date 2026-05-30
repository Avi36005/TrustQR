import { useNavigate } from 'react-router-dom'
import { getHistory, formatTimestamp } from '../utils/history'

function extractDomain(url) {
  try {
    const u = new URL(url)
    return u.hostname.replace(/^www\./, '')
  } catch {
    return url.slice(0, 40)
  }
}

function parseUpiParams(content) {
  try {
    const url = new URL(content)
    const params = Object.fromEntries(url.searchParams)
    return { payee: params.pn || '', upiId: params.pa || '' }
  } catch {
    return { payee: '', upiId: '' }
  }
}

function getDisplayContent(entry) {
  const { qr_type, qr_content } = entry
  if (qr_type === 'upi') {
    const { payee, upiId } = parseUpiParams(qr_content || '')
    return {
      primary: payee || upiId || 'UPI Payment',
      secondary: upiId ? upiId.slice(0, 30) : '',
    }
  }
  if (qr_type === 'url') {
    return {
      primary: extractDomain(qr_content || ''),
      secondary: (qr_content || '').slice(0, 40),
    }
  }
  return {
    primary: (qr_content || '').slice(0, 50),
    secondary: '',
  }
}

const typeLabels = {
  upi: 'UPI',
  url: 'URL',
  wifi: 'TEXT',
  text: 'TEXT',
  unknown: 'QR',
}

const safetyColors = {
  safe: '#2D7A4F',
  caution: '#D4A017',
  danger: '#C73E1D',
}

export default function History() {
  const navigate = useNavigate()
  const history = getHistory()

  function handleRow(entry) {
    navigate('/app/report', {
      state: {
        scan: entry,
        result: {
          safety: entry.safety,
          qr_type: entry.qr_type,
          verdict: entry.verdict,
          details: entry.details || {},
        },
      },
    })
  }

  return (
    <div className="app-page" style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ padding: '32px 24px 24px', maxWidth: 680, margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 24, color: '#000', marginBottom: 4, lineHeight: 1.2 }}>
          History
        </h1>
        <p style={{ fontSize: 13, color: '#888888', marginBottom: 32, lineHeight: 1.6 }}>
          Your recent scans. Stored only on this device.
        </p>

        {history.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 80 }}>
            <p style={{ fontSize: 15, color: '#888888', marginBottom: 8 }}>No scans yet.</p>
            <p style={{ fontSize: 13, color: '#888888' }}>Scans you make will appear here.</p>
          </div>
        ) : (
          <div>
            {history.map((entry) => (
              <button
                key={entry.id}
                onClick={() => handleRow(entry)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 0',
                  background: 'none',
                  border: 'none',
                  borderBottom: '1px solid #EEEEEE',
                  cursor: 'pointer',
                  textAlign: 'left',
                  gap: 12,
                }}
              >
                {(() => {
                  const { primary, secondary } = getDisplayContent(entry)
                  return (
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 10, letterSpacing: '0.1em', color: '#888888', textTransform: 'uppercase', marginBottom: 4, fontFamily: 'Inter, sans-serif', margin: '0 0 4px' }}>
                        {typeLabels[entry.qr_type] || 'QR'}
                      </p>
                      <p style={{ fontSize: 14, color: '#000000', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Inter, sans-serif', margin: '0 0 2px' }}>
                        {primary}
                      </p>
                      {secondary && (
                        <p style={{ fontSize: 12, color: '#888888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Inter, sans-serif', margin: 0 }}>
                          {secondary}
                        </p>
                      )}
                    </div>
                  )
                })()}
                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: safetyColors[entry.safety] || '#888888',
                    marginBottom: 4,
                    marginLeft: 'auto',
                  }} />
                  <p style={{ fontSize: 11, color: '#888888', fontFamily: 'Inter, sans-serif' }}>
                    {formatTimestamp(entry.timestamp)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
