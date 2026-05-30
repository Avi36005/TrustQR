import { useNavigate, useLocation } from 'react-router-dom'

const tabs = [
  { label: 'Scan', path: '/app/choose' },
  { label: 'History', path: '/history' },
  { label: 'Community', path: '/community' },
  { label: 'About', path: '/about' },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: 52,
      background: '#FFFFFF',
      borderTop: '1px solid #EEEEEE',
      display: 'flex',
      alignItems: 'stretch',
      zIndex: 100,
      maxWidth: 480,
      margin: '0 auto',
    }}>
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path ||
          (tab.path === '/app/choose' && location.pathname.startsWith('/app'))
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              borderTop: isActive ? '2px solid #000000' : '2px solid transparent',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              fontSize: 12,
              fontWeight: 500,
              color: isActive ? '#000000' : '#888888',
              paddingBottom: 4,
              paddingTop: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
