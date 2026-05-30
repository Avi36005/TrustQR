
function SectionLabel({ children }) {
  return (
    <p style={{ fontSize: 11, letterSpacing: '0.15em', color: '#888888', fontWeight: 500, fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', marginBottom: 16 }}>
      {children}
    </p>
  )
}

function Section({ label, children }) {
  return (
    <div style={{ padding: '28px 0', borderBottom: '1px solid #EEEEEE' }}>
      <SectionLabel>{label}</SectionLabel>
      {children}
    </div>
  )
}

export default function About() {
  return (
    <div className="app-page" style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ padding: '32px 24px 0', maxWidth: 680, margin: '0 auto' }}>

        <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 24, color: '#000', marginBottom: 32, lineHeight: 1.2 }}>
          About TrustQR
        </h1>

        <Section label="Built by">
          <p style={{ fontSize: 15, color: '#000', marginBottom: 4, lineHeight: 1.6 }}>Team TrustQR</p>
          <p style={{ fontSize: 15, color: '#000', marginBottom: 4, lineHeight: 1.6 }}>Hardik Hinduja</p>
          <p style={{ fontSize: 15, color: '#000', marginBottom: 12, lineHeight: 1.6 }}>Avinash Gehi</p>
          <p style={{ fontSize: 13, color: '#888888', lineHeight: 1.6 }}>Built for Codorra 2026 Hackathon</p>
        </Section>

        <Section label="The Problem">
          <p style={{ fontSize: 15, color: '#000', lineHeight: 1.6 }}>
            QR code scams are the fastest-growing digital fraud in India. Scammers paste fake QR codes over legitimate ones, send them via WhatsApp, and embed them in phishing links. A single scan can empty your UPI account or hand over your banking credentials. Most people scan first and think later.
          </p>
        </Section>

        <Section label="How We Help">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[
              { title: 'UPI Scam Detection', body: 'Identifies collect requests disguised as payment QR codes before money leaves your account.' },
              { title: 'Threat Intelligence', body: 'Every URL checked against Google Safe Browsing and URLhaus — two databases covering millions of known phishing and malware sites.' },
              { title: 'Community Warnings', body: 'Real people flag real scams. Every warning helps the next person who scans the same QR code.' },
            ].map(item => (
              <div key={item.title}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#000', fontFamily: 'DM Sans, sans-serif', marginBottom: 4 }}>{item.title}</p>
                <p style={{ fontSize: 14, color: '#555555', lineHeight: 1.6, margin: 0 }}>{item.body}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section label="Privacy & Surveillance">
          <p style={{ fontSize: 15, color: '#000', lineHeight: 1.6, marginBottom: 16 }}>
            QR code scams are a form of mass surveillance turned against citizens. Scammers use QR codes to harvest financial credentials, track device information, and build digital profiles of victims without their knowledge or consent.
          </p>
          <p style={{ fontSize: 15, color: '#000', lineHeight: 1.6, marginBottom: 16 }}>
            India's Digital Personal Data Protection Act 2023 gives citizens the right to know how their data is collected and used. TrustQR is built on the same principle — transparency before action. Know what a QR code does before you give it access to your device, your location, or your money.
          </p>
          <p style={{ fontSize: 15, color: '#000', lineHeight: 1.6 }}>
            No accounts. No tracking. Your scans stay on your device.
          </p>
        </Section>

<div style={{ textAlign: 'center', padding: '32px 0' }}>
          <p style={{ fontSize: 11, color: '#888888', fontFamily: 'Inter, sans-serif' }}>
            TrustQR — Codorra 2026 Hackathon
          </p>
        </div>

      </div>
    </div>
  )
}
