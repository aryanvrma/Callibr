'use client'

import { useActionState } from 'react'
import { login } from '@/lib/actions/auth'

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, null)

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form action={formAction} className="w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold">Log in to Callibr</h1>

        {state?.error && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}

        <div>
          <label htmlFor="email" className="block text-sm">Email</label>
          <input id="email" name="email" type="email" required className="w-full rounded border px-3 py-2" />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm">Password</label>
          <input id="password" name="password" type="password" required className="w-full rounded border px-3 py-2" />
        </div>

        <button type="submit" disabled={pending} className="w-full rounded bg-black py-2 text-white disabled:opacity-50">
          {pending ? 'Logging in...' : 'Log in'}
        </button>

        <p className="text-sm text-gray-500">
          No account? <a href="/signup" className="underline">Sign up</a>
        </p>
      </form>
    </div>
  )
}