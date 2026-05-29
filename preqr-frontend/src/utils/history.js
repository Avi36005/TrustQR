const HISTORY_KEY = 'preqr_history'

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export function getHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function addToHistory(entry) {
  const history = getHistory()
  const newEntry = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    ...entry,
  }
  history.unshift(newEntry)
  // keep max 100 entries
  const trimmed = history.slice(0, 100)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed))
  return newEntry
}

export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY)
}

export function formatTimestamp(iso) {
  const d = new Date(iso)
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
