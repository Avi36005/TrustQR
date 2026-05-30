import { useNavigate } from 'react-router-dom'
import { ArrowRight, Shield, Search, AlertTriangle, Lock, Zap } from 'lucide-react'

function FeatureRow({ icon: Icon, title, body }) {
  return (
    <div className="flex items-start gap-4 py-5 border-b border-[#E5E5E5] last:border-b-0">
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{ width: 32, height: 32, border: '1px solid #E5E5E5' }}
      >
        <Icon size={16} strokeWidth={1.5} color="#000" />
      </div>
      <div>
        <p className="text-sm font-semibold text-black mb-0.5">{title}</p>
        <p className="text-sm text-[#666] leading-relaxed">{body}</p>
      </div>
    </div>
  )
}

function ScamRow({ title, desc }) {
  return (
    <div style={{ padding: '14px 0', borderBottom: '1px solid #EEEEEE' }} className="last:border-b-0">
      <p style={{ fontSize: 14, fontWeight: 500, color: '#000', fontFamily: 'Inter, sans-serif' }}>— {title}</p>
      <p style={{ fontSize: 12, color: '#666', marginTop: 3, lineHeight: 1.5, fontFamily: 'Inter, sans-serif' }}>{desc}</p>
    </div>
  )
}

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* nav — mobile only; desktop uses TopNav */}
      <nav className="md:hidden">
        <div className="px-6 py-4 flex items-center max-w-4xl mx-auto">
          <span
            style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 18, color: '#000000' }}
          >
            TrustQR
          </span>
        </div>
      </nav>

      {/* hero */}
      <section className="px-6 pt-16 pb-12 max-w-4xl mx-auto">
        <p style={{
          fontSize: 11,
          letterSpacing: '0.15em',
          color: '#888888',
          fontWeight: 500,
          fontFamily: 'Inter, sans-serif',
          textTransform: 'uppercase',
          marginBottom: 24,
        }}>
          QR code safety — India
        </p>
        <h1
          className="text-black"
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 'clamp(38px, 5.5vw, 68px)',
            lineHeight: 1.1,
            letterSpacing: '-0.5px',
            maxWidth: 700,
            marginBottom: 0,
          }}
        >
          Know what a QR code does before you scan it.
        </h1>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 18, fontWeight: 400, color: '#555555', marginTop: 8, marginBottom: 24 }}>
          QR codes hide things. We don't.
        </p>
        <p className="text-base text-[#444] leading-relaxed mb-8" style={{ maxWidth: 520 }}>
          QR code scams are the fastest-growing fraud in India. A single scan can empty your UPI account or hand over your banking credentials. TrustQR checks every QR before you act on it.
        </p>
        <div className="flex flex-wrap items-center gap-5">
          <button
            onClick={() => navigate('/app/choose')}
            className="flex items-center gap-2 text-sm text-white hover:bg-[#1a1a1a] active:bg-[#333] transition-colors"
            style={{ background: '#000', padding: '14px 28px', borderRadius: 0, fontFamily: 'DM Sans, sans-serif', fontWeight: 500 }}
          >
            Get Started
            <ArrowRight size={16} strokeWidth={1.5} />
          </button>
          <p className="text-sm text-[#999]">Camera + image upload. No account needed.</p>
        </div>
      </section>

      {/* the problem */}
      <section style={{ borderTop: '1px solid #E5E5E5', borderBottom: '1px solid #E5E5E5' }}>
        <div className="px-6 py-12 max-w-4xl mx-auto grid md:grid-cols-2 gap-6 items-start">
          <div>
            <p style={{
              fontSize: 11,
              letterSpacing: '0.15em',
              color: '#888888',
              fontWeight: 500,
              fontFamily: 'Inter, sans-serif',
              textTransform: 'uppercase',
              marginBottom: 24,
            }}>
              The problem
            </p>
            <h2
              className="text-black mb-4"
              style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 28, lineHeight: 1.25 }}
            >
              QR codes hide what they do until it is too late.
            </h2>
            <p className="text-sm text-[#666] leading-relaxed mb-3">
              Scammers place fake QR codes on shop counters, send them in WhatsApp messages, and paste them over real codes in public places. There is no way to know what a QR links to without scanning it first.
            </p>
            <p className="text-sm text-[#666] leading-relaxed">
              The most dangerous type — the UPI collect request scam — makes you think you are receiving money. When you approve it, money leaves your account instead.
            </p>
          </div>

          <div style={{ border: '1px solid #E5E5E5' }}>
            <div className="px-4 py-3" style={{ borderBottom: '1px solid #E5E5E5', background: '#FAFAFA' }}>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#000000' }}>Common QR scam types in India</p>
            </div>
            <div className="px-4">
              <ScamRow title="UPI collect requests" desc="Looks like receiving money — actually sends money from your account" />
              <ScamRow title="Fake bank pages" desc="HDFC, SBI, ICICI lookalike URLs that steal login credentials" />
              <ScamRow title="APK downloads" desc="Links disguised as banking apps that install malware" />
              <ScamRow title="Redirect chains" desc="Short URLs that bounce through trackers before reaching phishing pages" />
              <ScamRow title="Merchant QR replacement" desc="Scammers paste their QR code over legitimate shop QR codes" />
            </div>
          </div>
        </div>
      </section>

      {/* how it works */}
      <section className="px-6 py-12 max-w-4xl mx-auto">
        <p style={{
          fontSize: 11,
          letterSpacing: '0.15em',
          color: '#888888',
          fontWeight: 500,
          fontFamily: 'Inter, sans-serif',
          textTransform: 'uppercase',
          marginBottom: 24,
        }}>
          How it works
        </p>
        <div className="grid md:grid-cols-3" style={{ border: '1px solid #E5E5E5' }}>
          {[
            {
              n: '01',
              title: 'Scan or upload',
              body: 'Point your camera at any QR code for automatic scanning, or upload a saved QR image from your gallery.',
            },
            {
              n: '02',
              title: 'We analyze it',
              body: 'Domain age, redirect chains, UPI type detection, blocklist checks, and community flags — all in under 2 seconds.',
            },
            {
              n: '03',
              title: 'Plain verdict',
              body: 'SAFE, CAUTION, or DANGER with a one-line explanation and the specific checks that flagged it.',
            },
          ].map((step, i) => (
            <div
              key={step.n}
              className="px-5 py-6"
              style={{
                borderRight: i < 2 ? '1px solid #E5E5E5' : 'none',
                borderBottom: '0',
              }}
            >
              <p
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontWeight: 700,
                  fontSize: 13,
                  color: '#000000',
                  marginBottom: 16,
                  letterSpacing: '0.05em',
                }}
              >
                {step.n}
              </p>
              <p className="text-sm font-semibold text-black mb-2">{step.title}</p>
              <p className="text-sm text-[#666] leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* what we check */}
      <section style={{ borderTop: '1px solid #E5E5E5' }}>
        <div className="px-6 py-12 max-w-4xl mx-auto">
          <p style={{
            fontSize: 11,
            letterSpacing: '0.15em',
            color: '#888888',
            fontWeight: 500,
            fontFamily: 'Inter, sans-serif',
            textTransform: 'uppercase',
            marginBottom: 24,
          }}>
            What we check
          </p>
          <div className="max-w-xl" style={{ border: '1px solid #E5E5E5' }}>
            <div className="px-4">
              <FeatureRow
                icon={AlertTriangle}
                title="UPI collect request detection"
                body="Parses UPI strings to identify collect requests before you see a payment prompt."
              />
              <FeatureRow
                icon={Shield}
                title="Google Safe Browsing + URLhaus"
                body="Every URL checked against two threat databases covering millions of known phishing and malware sites."
              />
              <FeatureRow
                icon={Search}
                title="Domain age check"
                body="Scam sites are created days before an attack. Domains under 30 days old are flagged."
              />
              <FeatureRow
                icon={Zap}
                title="Redirect chain tracking"
                body="Short URLs followed to their final destination so you see exactly where you will land."
              />
              <FeatureRow
                icon={Lock}
                title="No accounts. No data stored."
                body="Scan history stays on your device only. We store an anonymous hash for community flagging, nothing else."
              />
            </div>
          </div>
        </div>
      </section>

      {/* cta */}
      <section style={{ borderTop: '1px solid #E5E5E5', borderBottom: '1px solid #E5E5E5' }}>
        <div className="px-6 py-12 max-w-4xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2
              className="text-black mb-1"
              style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 28, lineHeight: 1.2 }}
            >
              Scan the next QR safely.
            </h2>
            <p className="text-sm text-[#666]">Free. No sign-up. Works on any device with a camera.</p>
          </div>
          <button
            onClick={() => navigate('/app/choose')}
            className="flex items-center gap-2 text-sm text-white hover:bg-[#1a1a1a] active:bg-[#333] transition-colors self-start md:self-auto flex-shrink-0"
            style={{ background: '#000', padding: '14px 28px', borderRadius: 0, fontFamily: 'DM Sans, sans-serif', fontWeight: 500 }}
          >
            Get Started
            <ArrowRight size={16} strokeWidth={1.5} />
          </button>
        </div>
      </section>

      {/* footer */}
      <footer className="px-6 py-5 max-w-4xl mx-auto flex items-center justify-between">
        <span
          style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 18, color: '#000000' }}
        >
          TrustQR
        </span>
        <p className="text-xs text-[#999]">Codorra 2026 Hackathon</p>
      </footer>

    </div>
  )
}
