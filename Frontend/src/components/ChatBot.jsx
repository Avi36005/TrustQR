import { useState, useRef, useEffect } from 'react'
import { CHATBOT_URL } from '../utils/api'
import { getHistory } from '../utils/history'

function inlineFormat(text, key) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return (
    <span key={key}>
      {parts.map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**')) return <strong key={i}>{p.slice(2, -2)}</strong>
        if (p.startsWith('*') && p.endsWith('*')) return <em key={i}>{p.slice(1, -1)}</em>
        return p
      })}
    </span>
  )
}

function MarkdownText({ text }) {
  const lines = text.split('\n')
  const elements = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (/^#{1,3} /.test(line)) {
      const content = line.replace(/^#{1,3} /, '')
      elements.push(<div key={i} style={{ fontWeight: 700, marginTop: i > 0 ? 6 : 0, marginBottom: 2 }}>{inlineFormat(content, 0)}</div>)
    } else if (/^[-*] /.test(line)) {
      elements.push(<div key={i} style={{ paddingLeft: 10, marginBottom: 1 }}>· {inlineFormat(line.slice(2), 0)}</div>)
    } else if (/^\d+\. /.test(line)) {
      elements.push(<div key={i} style={{ paddingLeft: 10, marginBottom: 1 }}>{inlineFormat(line, 0)}</div>)
    } else if (line.trim() === '') {
      elements.push(<div key={i} style={{ height: 6 }} />)
    } else {
      elements.push(<div key={i}>{inlineFormat(line, 0)}</div>)
    }
    i++
  }
  return <>{elements}</>
}

function buildScanContext(history) {
  if (!history || history.length === 0) return null
  const recent = history.slice(0, 10)
  const lines = recent.map((s, i) => {
    const type = (s.qr_type || 'unknown').toUpperCase()
    const safety = (s.safety || 'unknown').toUpperCase()
    const content = s.qr_content ? s.qr_content.slice(0, 80) : ''
    const verdict = s.verdict ? ` — ${s.verdict}` : ''
    const date = s.timestamp ? new Date(s.timestamp).toLocaleDateString('en-IN') : ''
    return `${i + 1}. [${safety}] ${type}: ${content}${verdict} (${date})`
  })
  return lines.join('\n')
}

const WELCOME = "Hi! I'm TrustQR AI. Ask me anything about QR code scams — paste a QR code URL or UPI string and I'll analyze it for you."

export default function ChatBot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([{ role: 'assistant', content: WELCOME }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [speaking, setSpeaking] = useState(null)
  const [listening, setListening] = useState(false)
  const [scanCount, setScanCount] = useState(0)
  const bottomRef = useRef(null)
  const audioRef = useRef(null)
  const inputRef = useRef(null)
  const scanContextRef = useRef(null)
  const recognitionRef = useRef(null)

  useEffect(() => {
    const h = getHistory()
    setScanCount(h.length)
    scanContextRef.current = buildScanContext(h)
  }, [])

  useEffect(() => {
    if (open) {
      const h = getHistory()
      setScanCount(h.length)
      scanContextRef.current = buildScanContext(h)
      if (inputRef.current) inputRef.current.focus()
    }
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
        body: JSON.stringify({ message: text, history, scan_context: scanContextRef.current }),
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

  function cleanForTTS(text) {
    return text
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/^[-*]\s+/gm, '')
      .replace(/^\d+\.\s+/gm, '')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\n{2,}/g, '. ')
      .replace(/\n/g, ' ')
      .trim()
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
        body: JSON.stringify({ text: cleanForTTS(text) }),
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

  function toggleVoiceInput() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return

    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }

    const rec = new SR()
    rec.lang = 'en-IN'
    rec.interimResults = false
    rec.maxAlternatives = 1
    recognitionRef.current = rec

    rec.onstart = () => setListening(true)
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript
      setInput(prev => (prev ? prev + ' ' + transcript : transcript))
    }
    rec.start()
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
              <p style={{ margin: 0, fontSize: 10, color: '#aaa' }}>
                {scanCount > 0 ? `synced with ${scanCount} scan${scanCount !== 1 ? 's' : ''}` : 'QR scam expert'}
              </p>
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
                    wordBreak: 'break-word',
                  }}
                >
                  {msg.role === 'user' ? msg.content : <MarkdownText text={msg.content} />}
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
            {(window.SpeechRecognition || window.webkitSpeechRecognition) && (
              <button
                onClick={toggleVoiceInput}
                title={listening ? 'Stop listening' : 'Speak your question'}
                style={{
                  background: listening ? '#C73E1D' : 'none',
                  border: 'none',
                  borderLeft: '1px solid #E5E5E5',
                  cursor: 'pointer',
                  padding: '0 12px',
                  color: listening ? '#fff' : '#888',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="5" y="1" width="4" height="7" rx="2" fill="currentColor"/>
                  <path d="M2 7a5 5 0 0010 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                  <line x1="7" y1="12" x2="7" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            )}
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
