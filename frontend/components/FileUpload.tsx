'use client'

import { useState, useRef } from 'react'
import { statementsApi } from '@/lib/api'

interface FileUploadProps {
  onSuccess: () => void
}

export default function FileUpload({ onSuccess }: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (file: File) => {
    if (!file.type.includes('pdf')) {
      setError('Please upload a PDF file')
      return
    }

    setError('')
    setUploading(true)

    try {
      await statementsApi.upload(file)
      onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleUpload(file)
  }

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
        dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      }`}
      onDragOver={(e) => {
        e.preventDefault()
        setDragActive(true)
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        onChange={handleChange}
        className="hidden"
      />

      {uploading ? (
        <div className="text-gray-600">Uploading...</div>
      ) : (
        <>
          <p className="text-gray-600 mb-4">
            Drag and drop your credit card statement PDF here, or
          </p>
          <button
            onClick={() => inputRef.current?.click()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Browse Files
          </button>
        </>
      )}

      {error && <p className="text-red-600 mt-4">{error}</p>}
    </div>
  )
}
