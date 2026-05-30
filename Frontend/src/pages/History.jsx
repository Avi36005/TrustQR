import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock } from 'lucide-react'
import { getHistory, formatTimestamp } from '../utils/history'
import SafetyDot from '../components/SafetyDot'

const typeLabels = {
  upi: 'UPI Payment',
  url: 'URL',
  wifi: 'Wi-Fi',
  text: 'Text',
  unknown: 'Unknown',
}

export default function History() {
  const navigate = useNavigate()
  const history = getHistory()

  function handleRowClick(entry) {
    navigate('/app/report', {
      state: {
        scan: entry,
        result: {
          safety: entry.safety,
          qr_type: entry.qr_type,
          verdict: entry.verdict,
          details: entry.details || {},
        },
      },
    })
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* header */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-[#E5E5E5]">
        <button
          onClick={() => navigate('/app')}
          className="p-1 -ml-1 bg-transparent border-none cursor-pointer"
          aria-label="Go back"
        >
          <ArrowLeft size={16} strokeWidth={1.5} color="#000" />
        </button>
        <span className="text-lg font-semibold text-black">History</span>
      </div>

      {/* list */}
      <div className="flex-1 overflow-y-auto">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 px-5 py-20 text-center">
            <Clock size={16} strokeWidth={1.5} color="#999" className="mb-4" />
            <p className="text-sm text-[#666]">
              No scans yet. Start scanning to build history.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#E5E5E5]">
            {history.map((entry) => (
              <button
                key={entry.id}
                onClick={() => handleRowClick(entry)}
                className="w-full flex items-center gap-3 px-5 py-4 bg-white hover:bg-[#FAFAFA] active:bg-[#F5F5F5] transition-colors text-left"
              >
                <SafetyDot safety={entry.safety} size={10} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-black truncate">
                    {typeLabels[entry.qr_type] || 'Unknown'}
                  </p>
                  <p className="text-xs text-[#999] mt-0.5 truncate">
                    {entry.qr_content}
                  </p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-xs text-[#999]">
                    {formatTimestamp(entry.timestamp)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
