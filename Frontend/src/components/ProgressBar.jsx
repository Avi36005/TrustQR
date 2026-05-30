export default function ProgressBar({ visible }) {
  if (!visible) return null
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-[#EEEEEE] overflow-hidden">
      <div
        className="h-full bg-black progress-indeterminate"
        style={{ width: '30%' }}
      />
    </div>
  )
}
