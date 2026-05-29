import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Shield, Search, BarChart2 } from 'lucide-react'

function Section({ title, children }) {
  return (
    <div className="border-b border-[#E5E5E5] px-5 py-5">
      <h2 className="text-sm font-semibold text-black mb-3 uppercase tracking-wider" style={{ fontSize: 12 }}>
        {title}
      </h2>
      {children}
    </div>
  )
}

export default function About() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* header */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-[#E5E5E5]">
        <button
          onClick={() => navigate('/')}
          className="p-1 -ml-1 bg-transparent border-none cursor-pointer"
          aria-label="Go back"
        >
          <ArrowLeft size={20} color="#000" />
        </button>
        <span className="text-lg font-semibold text-black">About</span>
      </div>

      {/* content */}
      <div className="flex-1 overflow-y-auto">

        <Section title="Why PreQR exists">
          <p className="text-sm text-[#444] leading-relaxed">
            QR code scams are rising rapidly across India. Fraudsters place fake QR codes in shops, on bills, and in messages to trick people into sending money or visiting malicious websites.
          </p>
          <p className="text-sm text-[#444] leading-relaxed mt-2">
            PreQR gives you a second opinion before you act — so you can scan confidently, not blindly.
          </p>
        </Section>

        <Section title="How it works">
          <ul className="flex flex-col gap-3">
            <li className="flex items-start gap-3">
              <Search size={16} color="#000" className="flex-shrink-0 mt-0.5" />
              <span className="text-sm text-[#444]">
                <strong className="text-black">Scan</strong> — point your camera at any QR code
              </span>
            </li>
            <li className="flex items-start gap-3">
              <BarChart2 size={16} color="#000" className="flex-shrink-0 mt-0.5" />
              <span className="text-sm text-[#444]">
                <strong className="text-black">Analyze</strong> — our backend checks domains, blocklists, UPI IDs, redirect chains, and community reports
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Shield size={16} color="#000" className="flex-shrink-0 mt-0.5" />
              <span className="text-sm text-[#444]">
                <strong className="text-black">Decide</strong> — get a plain-English verdict before you tap, pay, or visit
              </span>
            </li>
          </ul>
        </Section>

        <Section title="Built by">
          <p className="text-sm text-[#444]">
            Team TrustQR
          </p>
        </Section>

        <Section title="Privacy promise">
          <p className="text-sm text-[#444] leading-relaxed">
            QR contents are sent to our server only for analysis. We do not store your personal data, location, or device information. Scan history stays entirely on your device.
          </p>
        </Section>

      </div>

      {/* footer */}
      <div className="px-5 py-5 border-t border-[#E5E5E5]">
        <p className="text-xs text-[#999] text-center">
          Built for Codorra 2026 Hackathon
        </p>
      </div>
    </div>
  )
}
