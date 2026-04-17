'use client'

import { useState, useRef } from 'react'

interface Attachment {
  id: string
  originalName: string
  mimeType: string
  size: number
  uploadedBy: string
  uploadedAt: string
  filename: string
}

interface Props {
  stepId: string
  uploadedBy: string
  initialAttachments: Attachment[]
}

export default function FileUpload({ stepId, uploadedBy, initialAttachments }: Props) {
  const [attachments, setAttachments] = useState<Attachment[]>(initialAttachments)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')

    const fd = new FormData()
    fd.append('file', file)
    fd.append('stepId', stepId)
    fd.append('uploadedBy', uploadedBy)

    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const json = await res.json()

    if (!res.ok) {
      setError(json.error ?? 'Upload failed')
    } else {
      setAttachments((prev) => [...prev, json.attachment])
    }
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleDelete = async (id: string) => {
    const res = await fetch('/api/upload', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      setAttachments((prev) => prev.filter((a) => a.id !== id))
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-sm px-4 py-2 rounded-lg transition-colors">
          {uploading ? 'Uploading...' : 'Attach File'}
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
        <span className="text-xs text-slate-400">PDF, JPEG, PNG, Word · Max 10 MB</span>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {attachments.length > 0 && (
        <ul className="space-y-2">
          {attachments.map((a) => (
            <li key={a.id} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-4 py-2">
              <div className="flex items-center gap-3">
                <span className="text-lg">{fileIcon(a.mimeType)}</span>
                <div>
                  <a
                    href={a.filename}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-[#1e3a5f] hover:underline"
                  >
                    {a.originalName}
                  </a>
                  <div className="text-xs text-slate-400">{formatSize(a.size)} · {a.uploadedBy}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(a.id)}
                className="text-red-400 hover:text-red-600 text-sm px-2"
                aria-label="Remove"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function fileIcon(mimeType: string): string {
  if (mimeType === 'application/pdf') return '📄'
  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType.includes('word')) return '📝'
  return '📎'
}
