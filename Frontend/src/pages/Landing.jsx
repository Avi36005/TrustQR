import { useNavigate } from 'react-router-dom'
import { Shield, Search, ArrowRight, AlertTriangle, Lock, Zap } from 'lucide-react'

function StatBlock({ number, label }) {
  return (
    <div className="flex flex-col items-start">
      <span
        className="font-bold text-black"
        style={{ fontFamily: 'Instrument Serif, serif', fontSize: 40, lineHeight: 1 }}
      >
        {number}
      </span>
      <span className="text-sm text-[#666] mt-1 leading-snug">{label}</span>
    </div>
  )
}

function StepRow({ number, title, description }) {
  return (
    <div className="flex gap-5 py-6 border-b border-[#E5E5E5] last:border-b-0">
      <span
        className="text-[#999] flex-shrink-0 font-serif"
        style={{ fontFamily: 'Instrument Serif, serif', fontSize: 28, lineHeight: 1, marginTop: 2 }}
      >
        {number}
      </span>
      <div>
        <p className="text-base font-semibold text-black mb-1">{title}</p>
        <p className="text-sm text-[#666] leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

function FeatureRow({ icon: Icon, title, body }) {
  return (
    <div className="flex items-start gap-4 py-5 border-b border-[#E5E5E5] last:border-b-0">
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{ width: 36, height: 36, border: '1px solid #E5E5E5' }}
      >
        <Icon size={16} color="#000" />
      </div>
      <div>
        <p className="text-sm font-semibold text-black mb-0.5">{title}</p>
        <p className="text-sm text-[#666] leading-relaxed">{body}</p>
      </div>
    </div>
  )
}

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* nav */}
      <nav className="border-b border-[#E5E5E5] px-6 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <span
          className="text-xl text-black"
          style={{ fontFamily: 'Instrument Serif, serif' }}
        >
          TrustQR
        </span>
        <button
          onClick={() => navigate('/app')}
          className="text-sm text-black border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors"
        >
          Open Scanner
        </button>
      </nav>

      {/* hero */}
      <section className="px-6 pt-16 pb-16 max-w-5xl mx-auto">
        <div className="max-w-2xl">
          <div
            className="inline-block text-xs font-semibold uppercase tracking-widest text-[#666] border border-[#E5E5E5] px-3 py-1.5 mb-8"
          >
            QR Safety Scanner
          </div>
          <h1
            className="text-black mb-6"
            style={{
              fontFamily: 'Instrument Serif, serif',
              fontSize: 'clamp(40px, 6vw, 72px)',
              lineHeight: 1.1,
              letterSpacing: '-0.5px',
            }}
          >
            Think before
            <br />
            you scan.
          </h1>
          <p className="text-lg text-[#444] leading-relaxed mb-10 max-w-lg">
            QR codes are invisible until you scan them. TrustQR shows you exactly what a QR code does — before you tap, pay, or visit.
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/app')}
              className="flex items-center gap-2 bg-black text-white text-base font-medium px-6 py-3.5 hover:bg-[#1a1a1a] active:bg-[#333] transition-colors"
            >
              Get Started
              <ArrowRight size={16} />
            </button>
            <span className="text-sm text-[#999]">No sign-up needed</span>
          </div>
        </div>
      </section>

      {/* stats bar */}
      <section className="border-t border-b border-[#E5E5E5] px-6 py-10">
        <div className="max-w-5xl mx-auto grid grid-cols-3 gap-8">
          <StatBlock number="₹1.8T" label="Lost to cyber fraud in India in 2023" />
          <StatBlock number="40%" label="Of UPI scams start with a QR code" />
          <StatBlock number="0.3s" label="Average time to scan without thinking" />
        </div>
      </section>

      {/* problem */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#999] mb-4">The Problem</p>
            <h2
              className="text-black mb-5"
              style={{ fontFamily: 'Instrument Serif, serif', fontSize: 32, lineHeight: 1.2 }}
            >
              QR codes hide what they do until it's too late.
            </h2>
            <p className="text-sm text-[#666] leading-relaxed mb-4">
              A QR code in a restaurant, on a flyer, or in a WhatsApp message could link to a phishing site, trigger a UPI payment, or download malware — all without any visible warning.
            </p>
            <p className="text-sm text-[#666] leading-relaxed">
              In India, "collect request" scams are particularly dangerous: scammers send you a QR code claiming you'll receive money, when scanning it actually sends money from your account.
            </p>
          </div>
          <div className="border border-[#E5E5E5]">
            <div className="px-5 py-4 border-b border-[#E5E5E5] flex items-center gap-2">
              <AlertTriangle size={14} color="#C73E1D" />
              <span className="text-xs font-semibold text-[#C73E1D] uppercase tracking-wide">Common QR Scam Types</span>
            </div>
            <div className="divide-y divide-[#E5E5E5]">
              {[
                ['UPI Collect Requests', 'Looks like a payment to you — actually takes money away'],
                ['Lookalike Bank URLs', 'Fake HDFC, SBI, Paytm pages that steal credentials'],
                ['APK Downloads', 'Malicious Android apps disguised as banking apps'],
                ['Redirect Chains', 'Short URLs that bounce through trackers to malware'],
                ['Fake Merchant QRs', 'Replaced QR codes in shops redirecting payments'],
              ].map(([title, desc]) => (
                <div key={title} className="px-5 py-3.5">
                  <p className="text-sm font-medium text-black">{title}</p>
                  <p className="text-xs text-[#666] mt-0.5">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* how it works */}
      <section className="border-t border-[#E5E5E5] px-6 py-16 max-w-5xl mx-auto">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#999] mb-8">How It Works</p>
        <div className="max-w-xl">
          <StepRow
            number="01"
            title="Point your camera"
            description="Open TrustQR and aim at any QR code. Scanning is automatic — no buttons to press."
          />
          <StepRow
            number="02"
            title="We analyze it instantly"
            description="Our backend checks the content against domain blocklists, UPI scam databases, redirect chains, domain age, and community flags — all in under 2 seconds."
          />
          <StepRow
            number="03"
            title="Read the verdict"
            description="You get a clear SAFE, CAUTION, or DANGER result in plain English — not security jargon. For UPI QRs, we tell you whether money leaves or enters your account."
          />
        </div>
      </section>

      {/* features */}
      <section className="border-t border-[#E5E5E5] px-6 py-16 max-w-5xl mx-auto">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#999] mb-8">What We Check</p>
        <div className="max-w-xl border border-[#E5E5E5]">
          <FeatureRow
            icon={Shield}
            title="Google Safe Browsing + URLhaus"
            body="Every URL is checked against two threat intelligence databases covering millions of known malicious sites."
          />
          <FeatureRow
            icon={Search}
            title="UPI Collect Request Detection"
            body="We parse UPI strings to identify collect requests — the most common QR scam pattern in India — and warn you before you confirm."
          />
          <FeatureRow
            icon={AlertTriangle}
            title="Domain Age Check"
            body="Scam sites are often created days before an attack. Domains under 30 days old are flagged for extra scrutiny."
          />
          <FeatureRow
            icon={Zap}
            title="Redirect Chain Tracking"
            body="Short URLs and redirect chains are followed to their final destination so you see where you'll actually land."
          />
          <FeatureRow
            icon={Lock}
            title="No Accounts. No Tracking."
            body="Your scan history stays on your device. We only see an anonymous hash of QR content for community flagging — nothing else."
          />
        </div>
      </section>

      {/* cta */}
      <section className="border-t border-[#E5E5E5] px-6 py-16">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div>
            <h2
              className="text-black mb-2"
              style={{ fontFamily: 'Instrument Serif, serif', fontSize: 32, lineHeight: 1.2 }}
            >
              Start scanning safely.
            </h2>
            <p className="text-sm text-[#666]">Free. No account. Works on any device with a camera.</p>
          </div>
          <button
            onClick={() => navigate('/app')}
            className="flex items-center gap-2 bg-black text-white text-base font-medium px-6 py-3.5 hover:bg-[#1a1a1a] active:bg-[#333] transition-colors self-start md:self-auto flex-shrink-0"
          >
            Get Started
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* footer */}
      <footer className="border-t border-[#E5E5E5] px-6 py-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span
            className="text-base text-black"
            style={{ fontFamily: 'Instrument Serif, serif' }}
          >
            TrustQR
          </span>
          <p className="text-xs text-[#999]">Built for Codorra 2026 Hackathon</p>
        </div>
      </footer>

    </div>
  )
}
