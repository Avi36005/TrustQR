import { useNavigate, useLocation } from 'react-router-dom'

const navLinks = [
  { label: 'Scan', path: '/app/choose' },
  { label: 'History', path: '/history' },
  { label: 'Community', path: '/community' },
  { label: 'About', path: '/about' },
]

export default function TopNav() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <nav style={{
      height: 60,
      borderBottom: '1px solid #EEEEEE',
      background: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 48px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <span
        onClick={() => navigate('/')}
        style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 18, color: '#000', cursor: 'pointer' }}
      >
        TrustQR
      </span>
      <div style={{ display: 'flex', gap: 32 }}>
        {navLinks.map(link => {
          const isActive = location.pathname === link.path ||
            (link.path === '/app/choose' && location.pathname.startsWith('/app'))
          return (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', fontSize: 14,
                color: isActive ? '#000000' : '#888888',
                fontWeight: isActive ? 500 : 400,
                padding: 0,
              }}
            >
              {link.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
