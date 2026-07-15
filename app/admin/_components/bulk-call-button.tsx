'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function BulkCallButton({ pendingCount }: { pendingCount: number }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()

  async function handleClick() {
    if (pendingCount === 0) return
    if (!confirm(`Start calls for all ${pendingCount} pending/retry cases?`)) return

    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/cases/bulk-initiate-call', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setMessage(data.error ?? 'Failed to start bulk calls')
      } else {
        setMessage(
          `Triggered ${data.triggered} call(s).` +
          (data.failed?.length ? ` ${data.failed.length} failed.` : '')
        )
        router.refresh()
      }
    } catch {
      setMessage('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mb-4">
      <button
        onClick={handleClick}
        disabled={loading || pendingCount === 0}
        className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {loading ? 'Starting calls...' : `Call all pending (${pendingCount})`}
      </button>
      {message && <p className="text-sm text-gray-600 mt-2">{message}</p>}
    </div>
  )
}
