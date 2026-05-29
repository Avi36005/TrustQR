import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-start py-3 border-b border-[#E5E5E5] last:border-b-0 gap-4">
      <span className="text-sm text-[#666] flex-shrink-0">{label}</span>
      <span className="text-sm text-black text-right break-all">{value ?? '—'}</span>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="mb-0">
      <p className="text-xs font-semibold text-[#999] uppercase tracking-wider px-5 py-2 bg-[#FAFAFA] border-b border-[#E5E5E5]">
        {title}
      </p>
      <div className="px-5">
        {children}
      </div>
    </div>
  )
}

export default function Details() {
  const location = useLocation()
  const navigate = useNavigate()

  const state = location.state
  if (!state || !state.result) {
    navigate('/')
    return null
  }

  const { scan, result } = state
  const details = result.details || {}
  const urlInfo = details.url_info || {}
  const upiInfo = details.upi_info || null
  const checks = details.checks || []
  const redirectChain = urlInfo.redirect_chain || []
  const communityFlags = details.community_flags ?? 0

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* header */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-[#E5E5E5]">
        <button
          onClick={() => navigate(-1)}
          className="p-1 -ml-1 bg-transparent border-none cursor-pointer"
          aria-label="Go back"
        >
          <ArrowLeft size={20} color="#000" />
        </button>
        <span className="text-lg font-semibold text-black">Details</span>
      </div>

      {/* content */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#E5E5E5]">

        {/* what this qr contains */}
        <Section title="What This QR Contains">
          <Row label="Content" value={scan.qr_content} />
          <Row label="Type" value={result.qr_type?.toUpperCase() || 'UNKNOWN'} />
          <Row label="Safety" value={result.safety?.toUpperCase()} />
        </Section>

        {/* domain info for URLs */}
        {result.qr_type === 'url' && (
          <Section title="Domain Information">
            <Row label="Domain" value={urlInfo.domain} />
            <Row
              label="Domain Age"
              value={
                urlInfo.domain_age_days != null
                  ? urlInfo.domain_age_days < 30
                    ? `${urlInfo.domain_age_days} days (very new)`
                    : urlInfo.domain_age_days < 365
                    ? `${urlInfo.domain_age_days} days`
                    : `${Math.floor(urlInfo.domain_age_days / 365)} year(s)`
                  : '—'
              }
            />
            <Row label="HTTPS" value={urlInfo.https ? 'Yes' : 'No'} />
            <Row label="On Blocklist" value={urlInfo.on_blocklist ? 'Yes — flagged' : 'No'} />
          </Section>
        )}

        {/* UPI info */}
        {result.qr_type === 'upi' && upiInfo && (
          <Section title="UPI Information">
            <Row label="Payee Name" value={upiInfo.payee_name} />
            <Row label="UPI ID" value={upiInfo.upi_id} />
            <Row label="Amount" value={upiInfo.amount ? `₹${upiInfo.amount}` : 'Not specified'} />
            <Row
              label="Direction"
              value={upiInfo.direction === 'outgoing' ? 'Money leaves your account' : 'Money comes to your account'}
            />
            <Row
              label="Collect Request"
              value={upiInfo.is_collect_request ? 'Yes — be careful' : 'No'}
            />
          </Section>
        )}

        {/* redirect chain */}
        {result.qr_type === 'url' && (
          <Section title="Redirect Chain">
            {redirectChain.length === 0 ? (
              <p className="text-sm text-[#666] py-3">No redirects detected.</p>
            ) : (
              <div className="py-3 flex flex-col gap-2">
                {redirectChain.map((url, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-xs text-[#999] mt-0.5 flex-shrink-0">{i + 1}</span>
                    <span className="text-sm text-black break-all">{url}</span>
                    {i < redirectChain.length - 1 && (
                      <ArrowRight size={14} color="#999" className="flex-shrink-0 mt-0.5" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </Section>
        )}

        {/* trackers */}
        {result.qr_type === 'url' && (
          <Section title="Trackers Found">
            <Row
              label="Count"
              value={urlInfo.trackers_count != null ? String(urlInfo.trackers_count) : '0'}
            />
          </Section>
        )}

        {/* community reports */}
        <Section title="Community Reports">
          <Row
            label="Flagged by"
            value={communityFlags === 1 ? '1 person' : `${communityFlags} people`}
          />
        </Section>

      </div>
    </div>
  )
}
