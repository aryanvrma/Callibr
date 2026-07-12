'use client'

import { useActionState } from 'react'
import { createCase, createCasesFromCsv, type BulkUploadResult } from '@/lib/actions/cases'

export default function NewCasePage() {
  const [state, formAction, pending] = useActionState(createCase, null)
  const [bulkState, bulkFormAction, bulkPending] = useActionState(createCasesFromCsv, null)

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-10">
      <div>
        <h1 className="text-xl font-semibold mb-1">New verification request</h1>
        <p className="text-sm text-gray-500 mb-6">
          Submit a candidate for employment verification.
        </p>

      {state?.error && (
        <p className="text-sm text-red-600 mb-4 bg-red-50 border border-red-200 rounded p-3">
          {state.error}
        </p>
      )}

      <form action={formAction} className="space-y-6">
        <fieldset className="space-y-3 border rounded p-4">
          <legend className="text-sm font-medium px-1">Candidate details</legend>

          <div>
            <label htmlFor="candidateName" className="block text-sm">Full name</label>
            <input id="candidateName" name="candidateName" type="text" required
              className="w-full rounded border px-3 py-2" />
          </div>
          <div>
            <label htmlFor="candidatePhone" className="block text-sm">Phone</label>
            <input id="candidatePhone" name="candidatePhone" type="tel" required
              placeholder="+91XXXXXXXXXX"
              className="w-full rounded border px-3 py-2" />
          </div>
          <div>
            <label htmlFor="candidateEmail" className="block text-sm">Email (optional)</label>
            <input id="candidateEmail" name="candidateEmail" type="email"
              className="w-full rounded border px-3 py-2" />
          </div>
        </fieldset>

        <fieldset className="space-y-3 border rounded p-4">
          <legend className="text-sm font-medium px-1">Employer / HR contact</legend>

          <div>
            <label htmlFor="employerName" className="block text-sm">Company name</label>
            <input id="employerName" name="employerName" type="text" required
              className="w-full rounded border px-3 py-2" />
          </div>
          <div>
            <label htmlFor="hrContactName" className="block text-sm">HR contact name (optional)</label>
            <input id="hrContactName" name="hrContactName" type="text"
              className="w-full rounded border px-3 py-2" />
          </div>
          <div>
            <label htmlFor="hrContactPhone" className="block text-sm">HR contact phone</label>
            <input id="hrContactPhone" name="hrContactPhone" type="tel" required
              placeholder="+91XXXXXXXXXX"
              className="w-full rounded border px-3 py-2" />
          </div>
          <div>
            <label htmlFor="hrContactEmail" className="block text-sm">HR contact email (optional)</label>
            <input id="hrContactEmail" name="hrContactEmail" type="email"
              className="w-full rounded border px-3 py-2" />
          </div>
        </fieldset>

        <fieldset className="space-y-3 border rounded p-4">
          <legend className="text-sm font-medium px-1">Check details</legend>

          <div>
            <label htmlFor="checkType" className="block text-sm">Check type</label>
            <select id="checkType" name="checkType" className="w-full rounded border px-3 py-2">
              <option value="employment">Employment verification</option>
              <option value="reference">Reference check</option>
            </select>
          </div>

          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="consentGiven" className="mt-1" />
            <span>
              I confirm the candidate has provided signed consent for this background
              verification check, including contact of their listed employer.
            </span>
          </label>
        </fieldset>

        <button type="submit" disabled={pending}
          className="w-full rounded bg-black py-2 text-white disabled:opacity-50">
          {pending ? 'Submitting...' : 'Submit request'}
        </button>
      </form>
      </div>

      <div className="border-t pt-8">
        <h2 className="text-lg font-semibold mb-1">Bulk upload (CSV)</h2>
        <p className="text-sm text-gray-500 mb-4">
          For multiple candidates at once. CSV must include columns:
          <code className="block bg-gray-50 rounded p-2 mt-2 text-xs">
            candidate_name, candidate_phone, candidate_email, employer_name, hr_contact_name, hr_contact_phone, hr_contact_email, check_type
          </code>
          <span className="block mt-2">
            candidate_name, candidate_phone, employer_name, and hr_contact_phone are required —
            other columns can be left blank but must still be present as headers.
          </span>
        </p>

        {'error' in (bulkState ?? {}) && bulkState && (
          <p className="text-sm text-red-600 mb-4 bg-red-50 border border-red-200 rounded p-3">
            {(bulkState as { error: string }).error}
          </p>
        )}

        {bulkState && !('error' in bulkState) && (
          <div className="text-sm mb-4 bg-gray-50 border rounded p-3">
            <p>
              {(bulkState as BulkUploadResult).succeeded} of {(bulkState as BulkUploadResult).totalRows} rows
              created successfully.
            </p>
            {(bulkState as BulkUploadResult).failed.length > 0 && (
              <div className="mt-2">
                <p className="text-red-600">Failed rows:</p>
                <ul className="list-disc list-inside text-red-600">
                  {(bulkState as BulkUploadResult).failed.map((f) => (
                    <li key={f.row}>Row {f.row}: {f.reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <form action={bulkFormAction} className="space-y-3">
          <input type="file" name="csvFile" accept=".csv" required
            className="block w-full text-sm" />

          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="consentGivenBulk" className="mt-1" />
            <span>
              I confirm signed consent has been obtained for every candidate included in this file.
            </span>
          </label>

          <button type="submit" disabled={bulkPending}
            className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50">
            {bulkPending ? 'Uploading...' : 'Upload CSV'}
          </button>
        </form>
      </div>
    </div>
  )
}
