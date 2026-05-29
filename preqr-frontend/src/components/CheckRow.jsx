import { Check, X } from 'lucide-react'

export default function CheckRow({ label, passed, value }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-[#E5E5E5] last:border-b-0">
      <div
        className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
          passed ? 'bg-[#2D7A4F]' : 'bg-[#C73E1D]'
        }`}
      >
        {passed ? (
          <Check size={12} color="white" strokeWidth={3} />
        ) : (
          <X size={12} color="white" strokeWidth={3} />
        )}
      </div>
      <span className="flex-1 text-sm font-medium text-black">{label}</span>
      {value && (
        <span className="text-sm text-[#666] text-right max-w-[140px]">{value}</span>
      )}
    </div>
  )
}
