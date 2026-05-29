const colorMap = {
  safe: '#2D7A4F',
  caution: '#D4A017',
  danger: '#C73E1D',
}

export default function SafetyDot({ safety, size = 10 }) {
  const color = colorMap[safety] || '#999'
  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: color,
        flexShrink: 0,
      }}
    />
  )
}
