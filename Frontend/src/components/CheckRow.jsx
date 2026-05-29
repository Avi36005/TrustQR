import { Check, X } from 'lucide-react'

export default function CheckRow({ label, passed, value }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-[#E5E5E5] last:border-b-0">
      {passed ? (
        <Check size={15} color="#2D7A4F" strokeWidth={2.5} className="flex-shrink-0 mt-0.5" />
      ) : (
        <X size={15} color="#C73E1D" strokeWidth={2.5} className="flex-shrink-0 mt-0.5" />
      )}
      <span className="flex-1 text-sm text-black leading-snug">{label}</span>
      {value && (
        <span className="text-xs text-[#666] text-right leading-snug max-w-[130px]">{value}</span>
      )}
    </div>
  )
}
