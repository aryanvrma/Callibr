'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function CallButton({ caseId }: { caseId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleClick() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/cases/${caseId}/initiate-call`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to start call')
        setLoading(false)
        return
      }
      router.refresh()
    } catch (err) {
      setError('Network error')
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="rounded bg-black px-3 py-1 text-xs text-white disabled:opacity-50"
      >
        {loading ? 'Starting...' : 'Start call'}
      </button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}
