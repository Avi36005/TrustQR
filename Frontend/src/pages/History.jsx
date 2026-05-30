import { useNavigate } from 'react-router-dom'
import { getHistory, formatTimestamp } from '../utils/history'

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
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Inter, sans-serif', paddingBottom: 52 }}>
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
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: 10,
                    letterSpacing: '0.1em',
                    color: '#888888',
                    textTransform: 'uppercase',
                    marginBottom: 4,
                    fontFamily: 'Inter, sans-serif',
                  }}>
                    {typeLabels[entry.qr_type] || 'QR'}
                  </p>
                  <p style={{
                    fontSize: 13,
                    color: '#555555',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontFamily: 'Inter, sans-serif',
                  }}>
                    {(entry.qr_content || '').slice(0, 40)}
                  </p>
                </div>
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
