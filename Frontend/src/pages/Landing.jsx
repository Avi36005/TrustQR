import { useNavigate } from 'react-router-dom'
import { ArrowRight, Shield, Search, AlertTriangle, Lock, Zap } from 'lucide-react'

function FeatureRow({ icon: Icon, title, body }) {
  return (
    <div className="flex items-start gap-4 py-5 border-b border-[#E5E5E5] last:border-b-0">
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{ width: 32, height: 32, border: '1px solid #E5E5E5' }}
      >
        <Icon size={14} color="#000" />
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
    <div className="flex items-start gap-3 py-3.5 border-b border-[#E5E5E5] last:border-b-0">
      <span
        className="flex-shrink-0 mt-1.5"
        style={{ width: 5, height: 5, borderRadius: '50%', background: '#C73E1D', display: 'inline-block' }}
      />
      <div>
        <p className="text-sm font-medium text-black">{title}</p>
        <p className="text-xs text-[#666] mt-0.5 leading-snug">{desc}</p>
      </div>
    </div>
  )
}

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* nav */}
      <nav style={{ borderBottom: '1px solid #E5E5E5' }}>
        <div className="px-6 py-4 flex items-center justify-between max-w-4xl mx-auto">
          <span
            className="text-xl text-black"
            style={{ fontFamily: 'Instrument Serif, serif' }}
          >
            TrustQR
          </span>
          <button
            onClick={() => navigate('/app')}
            className="text-sm text-black px-4 py-2 hover:bg-[#F5F5F5] active:bg-[#EBEBEB] transition-colors"
            style={{ border: '1px solid #000' }}
          >
            Open Scanner
          </button>
        </div>
      </nav>

      {/* hero */}
      <section className="px-6 pt-16 pb-12 max-w-4xl mx-auto">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#999] mb-6">
          QR code safety — India
        </p>
        <h1
          className="text-black mb-5"
          style={{
            fontFamily: 'Instrument Serif, serif',
            fontSize: 'clamp(38px, 5.5vw, 68px)',
            lineHeight: 1.1,
            letterSpacing: '-0.5px',
            maxWidth: 700,
          }}
        >
          Know what a QR code does before you scan it.
        </h1>
        <p className="text-base text-[#444] leading-relaxed mb-8" style={{ maxWidth: 520 }}>
          QR code scams are the fastest-growing fraud in India. A single scan can empty your UPI account or hand over your banking credentials. TrustQR checks every QR before you act on it.
        </p>
        <div className="flex flex-wrap items-center gap-5">
          <button
            onClick={() => navigate('/app')}
            className="flex items-center gap-2 text-sm font-medium text-white px-5 py-3 hover:bg-[#1a1a1a] active:bg-[#333] transition-colors"
            style={{ background: '#000' }}
          >
            Get Started
            <ArrowRight size={15} />
          </button>
          <p className="text-sm text-[#999]">Camera + image upload. No account needed.</p>
        </div>
      </section>

      {/* the problem */}
      <section style={{ borderTop: '1px solid #E5E5E5', borderBottom: '1px solid #E5E5E5' }}>
        <div className="px-6 py-12 max-w-4xl mx-auto grid md:grid-cols-2 gap-10 items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#999] mb-4">The problem</p>
            <h2
              className="text-black mb-4"
              style={{ fontFamily: 'Instrument Serif, serif', fontSize: 28, lineHeight: 1.25 }}
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
              <p className="text-xs font-semibold uppercase tracking-widest text-[#C73E1D]">Common QR scam types in India</p>
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
        <p className="text-xs font-semibold uppercase tracking-widest text-[#999] mb-8">How it works</p>
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
                className="text-[#CCC] mb-4"
                style={{ fontFamily: 'Instrument Serif, serif', fontSize: 30, lineHeight: 1 }}
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
          <p className="text-xs font-semibold uppercase tracking-widest text-[#999] mb-8">What we check</p>
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
              style={{ fontFamily: 'Instrument Serif, serif', fontSize: 28, lineHeight: 1.2 }}
            >
              Scan the next QR safely.
            </h2>
            <p className="text-sm text-[#666]">Free. No sign-up. Works on any device with a camera.</p>
          </div>
          <button
            onClick={() => navigate('/app')}
            className="flex items-center gap-2 text-sm font-medium text-white px-5 py-3 hover:bg-[#1a1a1a] active:bg-[#333] transition-colors self-start md:self-auto flex-shrink-0"
            style={{ background: '#000' }}
          >
            Get Started
            <ArrowRight size={15} />
          </button>
        </div>
      </section>

      {/* footer */}
      <footer className="px-6 py-5 max-w-4xl mx-auto flex items-center justify-between">
        <span
          className="text-base text-black"
          style={{ fontFamily: 'Instrument Serif, serif' }}
        >
          TrustQR
        </span>
        <p className="text-xs text-[#999]">Codorra 2026 Hackathon</p>
      </footer>

    </div>
  )
}
