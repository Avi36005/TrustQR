import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function FeedCard({ item }) {
  const [expanded, setExpanded] = useState(false)
  const preview = item.qr_preview || {}
  const warnings = item.warnings || []
  const visibleWarnings = expanded ? warnings : warnings.slice(0, 3)

  return (
    <div
      style={{ border: '1px solid #EEEEEE', borderLeft: '3px solid #C73E1D', padding: 16, marginBottom: 16, background: '#fff' }}
      onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
      onMouseLeave={e => e.currentTarget.style.background = '#fff'}
    >
      {/* top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', background: '#FFF5F3', color: '#C73E1D', border: '1px solid #C73E1D', padding: '2px 8px', borderRadius: 0 }}>
            RISKY
          </span>
          <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', background: '#F5F5F5', color: '#555555', border: '1px solid #EEEEEE', padding: '2px 8px', borderRadius: 0 }}>
            {(item.qr_type === 'wifi' ? 'TEXT' : item.qr_type || 'QR').toUpperCase()}
          </span>
        </div>
        <span style={{ fontSize: 12, color: '#C73E1D', fontWeight: 600 }}>
          ⚠ {item.flag_count} {item.flag_count === 1 ? 'report' : 'reports'}
        </span>
      </div>

      {/* content preview */}
      <div style={{ marginBottom: 12 }}>
        {item.qr_type === 'upi' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {preview.payee_name && <p style={{ fontSize: 13, color: '#000', fontFamily: 'Inter, sans-serif', margin: 0 }}>Payee: {preview.payee_name}</p>}
            {preview.upi_id && <p style={{ fontSize: 13, color: '#000', fontFamily: 'Inter, sans-serif', margin: 0 }}>UPI ID: {preview.upi_id}</p>}
            {preview.amount && <p style={{ fontSize: 13, color: '#C73E1D', fontFamily: 'Inter, sans-serif', margin: 0 }}>Amount: ₹{preview.amount} pre-filled</p>}
            {preview.is_collect && <p style={{ fontSize: 13, color: '#C73E1D', fontFamily: 'Inter, sans-serif', fontWeight: 600, margin: 0 }}>Type: COLLECT REQUEST</p>}
          </div>
        ) : item.qr_type === 'url' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {preview.domain && <p style={{ fontSize: 13, color: '#000', fontFamily: 'Inter, sans-serif', margin: 0 }}>URL: {preview.domain}</p>}
          </div>
        ) : (
          <p style={{ fontSize: 13, color: '#555555', fontFamily: 'Inter, sans-serif', margin: 0 }}>{preview.raw_preview}</p>
        )}
      </div>

      {/* warnings */}
      {visibleWarnings.length > 0 && (
        <div style={{ borderTop: '1px solid #EEEEEE', paddingTop: 10, marginBottom: 8 }}>
          {visibleWarnings.map((w, i) => (
            <div key={i} style={{ marginBottom: i < visibleWarnings.length - 1 ? 10 : 0 }}>
              <p style={{ fontSize: 11, color: '#888888', fontFamily: 'Inter, sans-serif', margin: '0 0 2px' }}>{w.display_name} · {w.time_ago}</p>
              <p style={{ fontSize: 13, color: '#000', fontFamily: 'Inter, sans-serif', lineHeight: 1.5, margin: '0 0 2px' }}>{w.warning_message}</p>
              <p style={{ fontSize: 11, color: '#888888', fontFamily: 'Inter, sans-serif', margin: 0 }}>via {w.received_via}{w.city ? ` · ${w.city}` : ''}</p>
            </div>
          ))}
          {!expanded && warnings.length > 3 && (
            <button onClick={() => setExpanded(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#000', textDecoration: 'underline', padding: 0, marginTop: 8 }}>
              See {warnings.length - 3} more warning{warnings.length - 3 !== 1 ? 's' : ''} →
            </button>
          )}
        </div>
      )}

      {/* bottom row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <span style={{ fontSize: 11, color: '#888888', fontFamily: 'Inter, sans-serif' }}>First reported: {new Date(item.first_flagged_at).toLocaleDateString('en-IN')}</span>
        <span style={{ fontSize: 11, color: '#888888', fontFamily: 'Inter, sans-serif' }}>Last: {item.time_ago}</span>
      </div>
    </div>
  )
}

export default function Community() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ total_scans: 0, total_flags: 0 })
  const [feed, setFeed] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')

  async function fetchStats() {
    try {
      const r = await fetch(`${API_URL}/api/stats`)
      if (r.ok) setStats(await r.json())
    } catch {}
  }

  async function fetchFeed() {
    try {
      const r = await fetch(`${API_URL}/api/community/feed?limit=20`)
      if (r.ok) {
        const data = await r.json()
        setFeed(data.items)
      }
    } catch {}
  }

  async function handleRefresh() {
    setRefreshing(true)
    await Promise.all([fetchStats(), fetchFeed()])
    setRefreshing(false)
  }

  useEffect(() => {
    Promise.all([fetchStats(), fetchFeed()]).then(() => setLoading(false))
  }, [])

  const filtered = feed.filter(item => {
    if (!search) return true
    const s = search.toLowerCase()
    const p = item.qr_preview || {}
    return (
      (p.upi_id || '').toLowerCase().includes(s) ||
      (p.payee_name || '').toLowerCase().includes(s) ||
      (p.domain || '').toLowerCase().includes(s) ||
      (p.raw_preview || '').toLowerCase().includes(s)
    )
  })

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Inter, sans-serif', paddingBottom: 52 }}>
      <div style={{ padding: '32px 24px 0', maxWidth: 680, margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 24, color: '#000', marginBottom: 4, lineHeight: 1.2 }}>
          Community Warnings
        </h1>
        <p style={{ fontSize: 13, color: '#888888', marginBottom: 24, lineHeight: 1.6 }}>
          QR codes flagged as scams by the community.
        </p>

        {/* stats bar */}
        <div style={{ border: '1px solid #EEEEEE', padding: 20, display: 'flex', marginBottom: 24 }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 28, color: '#000', margin: 0, lineHeight: 1 }}>{stats.total_scans.toLocaleString()}</p>
            <p style={{ fontSize: 11, color: '#888888', margin: '6px 0 0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>QR codes scanned</p>
          </div>
          <div style={{ width: 1, background: '#EEEEEE', margin: '0 20px' }} />
          <div style={{ flex: 1, textAlign: 'center' }}>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 28, color: '#000', margin: 0, lineHeight: 1 }}>{stats.total_flags.toLocaleString()}</p>
            <p style={{ fontSize: 11, color: '#888888', margin: '6px 0 0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Scams reported</p>
          </div>
        </div>

        {/* search */}
        <div style={{ position: 'relative', marginBottom: 24 }}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by UPI ID, domain, or keyword..."
            style={{ width: '100%', border: '1px solid #CCCCCC', borderRadius: 0, padding: '12px 40px 12px 16px', fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#000', background: '#fff', outline: 'none', boxSizing: 'border-box' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#888' }}>×</button>
          )}
        </div>

        {/* section label + refresh button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <p style={{ fontSize: 11, letterSpacing: '0.15em', color: '#888888', fontWeight: 500, textTransform: 'uppercase', margin: 0 }}>
            Flagged QR Codes
          </p>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{ padding: '8px 20px', background: '#fff', border: '1px solid #000', borderRadius: 0, cursor: refreshing ? 'default' : 'pointer', fontSize: 13, fontFamily: 'Inter, sans-serif', color: '#000', opacity: refreshing ? 0.5 : 1 }}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        <p style={{ fontSize: 13, color: '#888888', marginBottom: 24, lineHeight: 1.6 }}>
          QR codes reported as risky by the community.
        </p>

        {/* feed */}
        {loading ? (
          <p style={{ fontSize: 14, color: '#888888', textAlign: 'center', paddingTop: 40 }}>Loading...</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 60 }}>
            <p style={{ fontSize: 15, color: '#888888', marginBottom: 8 }}>No risky QR codes reported yet.</p>
            <p style={{ fontSize: 13, color: '#888888', marginBottom: 16 }}>When the community flags a QR code as risky, it will appear here.</p>
            <button onClick={() => navigate('/app/choose')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#000', textDecoration: 'underline' }}>
              Scan a QR code →
            </button>
          </div>
        ) : (
          filtered.map(item => <FeedCard key={item.qr_hash} item={item} />)
        )}
      </div>
    </div>
  )
}
