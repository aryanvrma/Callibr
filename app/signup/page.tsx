'use client'

import { useActionState } from 'react'
import { signup } from '@/lib/actions/auth'

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signup, null)

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form action={formAction} className="w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold">Create your Callibr account</h1>

        {state?.error && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}

        <div>
          <label htmlFor="fullName" className="block text-sm">Full name</label>
          <input id="fullName" name="fullName" type="text" required className="w-full rounded border px-3 py-2" />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm">Email</label>
          <input id="email" name="email" type="email" required className="w-full rounded border px-3 py-2" />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm">Password</label>
          <input id="password" name="password" type="password" required minLength={6} className="w-full rounded border px-3 py-2" />
        </div>

        <button type="submit" disabled={pending} className="w-full rounded bg-black py-2 text-white disabled:opacity-50">
          {pending ? 'Signing up...' : 'Sign up'}
        </button>

        <p className="text-sm text-gray-500">
          Already have an account? <a href="/login" className="underline">Log in</a>
        </p>
      </form>
    </div>
  )
}