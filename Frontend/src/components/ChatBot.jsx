import { useState, useRef, useEffect } from 'react'
import { CHATBOT_URL } from '../utils/api'

const WELCOME = "Hi! I'm TrustQR AI. Ask me anything about QR code scams — paste a QR code URL or UPI string and I'll analyze it for you."

export default function ChatBot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([{ role: 'assistant', content: WELCOME }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [speaking, setSpeaking] = useState(null)
  const bottomRef = useRef(null)
  const audioRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus()
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')

    const history = messages.filter(m => m.role !== 'system')
    const newMessages = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const res = await fetch(`${CHATBOT_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      })
      if (!res.ok) throw new Error('Chat failed')
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I could not connect right now. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  async function speakMessage(text, idx) {
    if (speaking === idx) {
      audioRef.current?.pause()
      setSpeaking(null)
      return
    }
    setSpeaking(idx)
    try {
      const res = await fetch(`${CHATBOT_URL}/api/speak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) throw new Error('TTS failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = url
        audioRef.current.onended = () => setSpeaking(null)
        audioRef.current.play()
      }
    } catch {
      setSpeaking(null)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      <audio ref={audioRef} style={{ display: 'none' }} />

      {/* floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Open TrustQR AI chat"
        style={{
          position: 'fixed',
          bottom: 68,
          right: 16,
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: '#000',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200,
          boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
        }}
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <line x1="2" y1="2" x2="16" y2="16" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
            <line x1="16" y1="2" x2="2" y2="16" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M2 4a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H7l-4 3V4z" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      {/* chat panel */}
      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: 124,
            right: 16,
            width: 320,
            maxWidth: 'calc(100vw - 32px)',
            height: 460,
            background: '#fff',
            border: '1px solid #E5E5E5',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 199,
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {/* header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #E5E5E5',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: '#000',
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%', background: '#2D7A4F', flexShrink: 0,
            }} />
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: 'DM Sans, sans-serif' }}>TrustQR AI</p>
              <p style={{ margin: 0, fontSize: 10, color: '#aaa' }}>QR scam expert</p>
            </div>
          </div>

          {/* messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 4px' }}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  marginBottom: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '85%',
                    padding: '8px 12px',
                    background: msg.role === 'user' ? '#000' : '#F5F5F5',
                    color: msg.role === 'user' ? '#fff' : '#000',
                    fontSize: 13,
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {msg.content}
                </div>
                {msg.role === 'assistant' && (
                  <button
                    onClick={() => speakMessage(msg.content, idx)}
                    title={speaking === idx ? 'Stop speaking' : 'Listen'}
                    style={{
                      marginTop: 4,
                      background: 'none',
                      border: '1px solid #E5E5E5',
                      cursor: 'pointer',
                      padding: '2px 8px',
                      fontSize: 10,
                      color: speaking === idx ? '#C73E1D' : '#888',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    {speaking === idx ? (
                      <>
                        <svg width="10" height="10" viewBox="0 0 10 10"><rect x="2" y="1" width="2.5" height="8" fill="currentColor"/><rect x="5.5" y="1" width="2.5" height="8" fill="currentColor"/></svg>
                        stop
                      </>
                    ) : (
                      <>
                        <svg width="10" height="10" viewBox="0 0 10 10"><polygon points="1,1 9,5 1,9" fill="currentColor"/></svg>
                        listen
                      </>
                    )}
                  </button>
                )}
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: 4, padding: '8px 12px', alignItems: 'center' }}>
                {[0, 1, 2].map(i => (
                  <span key={i} style={{
                    width: 6, height: 6, borderRadius: '50%', background: '#ccc',
                    animation: `bounce 1s ${i * 0.15}s infinite`,
                  }} />
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* input */}
          <div style={{ borderTop: '1px solid #E5E5E5', display: 'flex', gap: 0 }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about a QR code..."
              rows={1}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                padding: '12px 14px',
                fontFamily: 'Inter, sans-serif',
                fontSize: 13,
                resize: 'none',
                background: '#fff',
                color: '#000',
                lineHeight: 1.5,
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{
                background: '#000',
                border: 'none',
                cursor: loading || !input.trim() ? 'default' : 'pointer',
                padding: '0 16px',
                color: '#fff',
                fontSize: 13,
                opacity: loading || !input.trim() ? 0.4 : 1,
                flexShrink: 0,
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
      `}</style>
    </>
  )
}
