'use client'

import { useState, useRef } from 'react'

interface Props {
  stepId: string
  uploaderName: string
}

export default function PortalFileUpload({ stepId, uploaderName }: Props) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploaded, setUploaded] = useState<string[]>([])
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')
    setIsUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('stepId', stepId)
      fd.append('uploadedBy', uploaderName)

      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Upload failed')
      }
      setUploaded((prev) => [...prev, file.name])
      if (inputRef.current) inputRef.current.value = ''
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    }
    setIsUploading(false)
  }

  return (
    <div>
      <label className="inline-flex items-center gap-2 cursor-pointer text-xs border border-slate-300 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        {isUploading ? 'Uploading…' : 'Attach File (PDF, Word, Image)'}
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          onChange={handleUpload}
          disabled={isUploading}
        />
      </label>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      {uploaded.length > 0 && (
        <div className="mt-1 space-y-0.5">
          {uploaded.map((name) => (
            <p key={name} className="text-xs text-emerald-600">✓ {name} uploaded</p>
          ))}
        </div>
      )}
    </div>
  )
}
