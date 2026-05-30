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
      borderBottom: '1px solid #EEEEEE',
      background: '#fff',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      width: '100%',
      boxSizing: 'border-box',
    }}>
      <div style={{
        height: 60,
        display: 'flex',
        alignItems: 'center',
        padding: '0 32px',
        maxWidth: 1200,
        margin: '0 auto',
        width: '100%',
      }}>
        {/* logo — left edge */}
        <span
          onClick={() => navigate('/')}
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontWeight: 700,
            fontSize: 18,
            color: '#000',
            cursor: 'pointer',
            flexShrink: 0,
            marginRight: 'auto',
            paddingRight: 24,
          }}
        >
          TrustQR
        </span>

        {/* nav links — right side */}
        <div style={{ display: 'flex', gap: 28, flexShrink: 0 }}>
          {navLinks.map(link => {
            const isActive =
              location.pathname === link.path ||
              (link.path === '/app/choose' && location.pathname.startsWith('/app'))
            return (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 14,
                  color: isActive ? '#000000' : '#888888',
                  fontWeight: isActive ? 500 : 400,
                  padding: 0,
                  whiteSpace: 'nowrap',
                }}
              >
                {link.label}
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
