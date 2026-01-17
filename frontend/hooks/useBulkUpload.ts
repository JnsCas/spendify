'use client'

import { useState, useCallback, useEffect } from 'react'
import { AxiosError } from 'axios'
import { statementsApi } from '@/lib/api'
import { useImportStore, type ImportItem } from '@/lib/importStore'
import type { FileUploadStatus, DuplicateFile } from '@/lib/types/bulk-upload'

const MAX_FILES = 12
const MAX_FILE_SIZE = 500 * 1024 // 500KB
const POLL_INTERVAL = 3000 // 3 seconds

interface LocalFile {
  localId: string
  file: File
}

export function useBulkUpload() {
  // Local state for File objects (not serializable, can't go in Zustand)
  const [localFiles, setLocalFiles] = useState<LocalFile[]>([])

  // Global store for persistent state
  const {
    items,
    duplicates,
    isUploading,
    uploadError,
    addItems,
    updateItem,
    updateItemByStatementId,
    removeItem,
    clearAll: clearStore,
    setUploading,
    setError,
    setDuplicates,
    clearDuplicates,
    hasActiveTasks,
  } = useImportStore()

  const generateLocalId = () => `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  const validateFile = (file: File): string | null => {
    if (file.type !== 'application/pdf') {
      return `${file.name}: Only PDF files are allowed`
    }
    if (file.size > MAX_FILE_SIZE) {
      return `${file.name}: File size must be less than 500KB`
    }
    return null
  }

  const addFiles = useCallback((newFiles: File[]) => {
    setError(null)
    clearDuplicates()

    // Only count active items (not completed/failed) towards the limit
    const activeItems = items.filter(
      (item) => !['completed', 'failed'].includes(item.status)
    )
    const currentCount = activeItems.length + localFiles.length
    const availableSlots = MAX_FILES - currentCount

    if (availableSlots <= 0) {
      setError(`Maximum ${MAX_FILES} files allowed`)
      return
    }

    const filesToAdd = newFiles.slice(0, availableSlots)
    const validationErrors: string[] = []

    const validFiles = filesToAdd.filter((file) => {
      const error = validateFile(file)
      if (error) {
        validationErrors.push(error)
        return false
      }
      return true
    })

    if (validationErrors.length > 0) {
      setError(validationErrors.join('. '))
    }

    if (validFiles.length > 0) {
      const newLocalFiles: LocalFile[] = validFiles.map((file) => ({
        localId: generateLocalId(),
        file,
      }))

      const newItems: ImportItem[] = newLocalFiles.map((lf) => ({
        localId: lf.localId,
        filename: lf.file.name,
        fileSize: lf.file.size,
        status: 'queued' as FileUploadStatus,
        progress: 0,
      }))

      setLocalFiles((prev) => [...prev, ...newLocalFiles])
      addItems(newItems)
    }
  }, [items.length, localFiles.length, addItems, setError, clearDuplicates])

  const removeFile = useCallback((localId: string) => {
    setLocalFiles((prev) => prev.filter((f) => f.localId !== localId))
    removeItem(localId)
  }, [removeItem])

  const clearAll = useCallback(() => {
    setLocalFiles([])
    clearStore()
  }, [clearStore])

  const startUpload = useCallback(async () => {
    const currentItems = useImportStore.getState().items
    const queuedItems = currentItems.filter((f) => f.status === 'queued')
    if (queuedItems.length === 0) return

    setUploading(true)
    setError(null)
    clearDuplicates()

    // Mark all as uploading
    queuedItems.forEach((item) => {
      updateItem(item.localId, { status: 'uploading', progress: 10 })
    })

    try {
      // Get File objects for queued items
      const filesToUpload = queuedItems
        .map((item) => localFiles.find((lf) => lf.localId === item.localId)?.file)
        .filter((f): f is File => f !== undefined)

      const response = await statementsApi.uploadBulk(filesToUpload)

      // Handle duplicates
      if (response.duplicates && response.duplicates.length > 0) {
        setDuplicates(response.duplicates)
        const freshItems = useImportStore.getState().items
        response.duplicates.forEach((dup: DuplicateFile) => {
          const item = freshItems.find((i) => i.filename === dup.originalFilename && i.status === 'uploading')
          if (item) {
            updateItem(item.localId, {
              status: 'failed',
              error: `Duplicate: already uploaded as "${dup.existingFilename}"`,
              progress: 0,
            })
          }
        })
      }

      // Map response to items
      const freshItems = useImportStore.getState().items
      response.statements.forEach((responseItem) => {
        const item = freshItems.find(
          (i) => i.filename === responseItem.originalFilename && i.status === 'uploading'
        )
        if (item) {
          updateItem(item.localId, {
            statementId: responseItem.id,
            status: responseItem.status as FileUploadStatus,
            progress: 25,
          })
        }
      })

      // Clear local files that were uploaded
      const uploadedFilenames = response.statements.map((s) => s.originalFilename)
      setLocalFiles((prev) =>
        prev.filter((lf) => !uploadedFilenames.includes(lf.file.name))
      )
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 413) {
        setError('The files are too large. Please reduce the file size or upload fewer files at once.')
      } else if (error instanceof AxiosError && error.response?.data?.message) {
        setError(error.response.data.message)
      } else {
        setError('Upload failed. Please try again.')
      }
      const freshItems = useImportStore.getState().items
      freshItems.filter((f) => f.status === 'uploading').forEach((item) => {
        updateItem(item.localId, { status: 'failed', progress: 0 })
      })
    } finally {
      setUploading(false)
    }
  }, [localFiles, updateItem, setUploading, setError, setDuplicates, clearDuplicates])

  const retryFile = useCallback(async (localId: string) => {
    const currentItems = useImportStore.getState().items
    const item = currentItems.find((f) => f.localId === localId)
    const localFile = localFiles.find((f) => f.localId === localId)

    if (!item || item.status !== 'failed' || !localFile) return

    updateItem(localId, { status: 'uploading', progress: 10, error: undefined })

    try {
      const response = await statementsApi.uploadBulk([localFile.file])

      if (response.duplicates && response.duplicates.length > 0) {
        const dup = response.duplicates[0]
        updateItem(localId, {
          status: 'failed',
          error: `Duplicate: already uploaded as "${dup.existingFilename}"`,
          progress: 0,
        })
        return
      }

      const responseItem = response.statements[0]
      if (responseItem) {
        updateItem(localId, {
          statementId: responseItem.id,
          status: responseItem.status as FileUploadStatus,
          progress: 25,
        })
        setLocalFiles((prev) => prev.filter((lf) => lf.localId !== localId))
      }
    } catch (error) {
      let errorMessage = 'Upload failed. Please try again.'
      if (error instanceof AxiosError && error.response?.status === 413) {
        errorMessage = 'The files are too large. Please reduce the file size or upload fewer files at once.'
      } else if (error instanceof AxiosError && error.response?.data?.message) {
        errorMessage = error.response.data.message
      }
      updateItem(localId, {
        status: 'failed',
        error: errorMessage,
        progress: 0,
      })
    }
  }, [localFiles, updateItem])

  // Simple polling effect - polls when there are pending/processing items
  useEffect(() => {
    const pendingIds = items
      .filter(item => item.statementId && (item.status === 'pending' || item.status === 'processing'))
      .map(item => item.statementId!)

    if (pendingIds.length === 0) return

    const poll = async () => {
      try {
        const response = await statementsApi.getStatuses(pendingIds)
        response.statuses.forEach((statusItem) => {
          let progress = 0
          if (statusItem.status === 'pending') progress = 25
          if (statusItem.status === 'processing') progress = 50
          if (statusItem.status === 'completed') progress = 100
          if (statusItem.status === 'failed') progress = 100

          updateItemByStatementId(statusItem.id, {
            status: statusItem.status as FileUploadStatus,
            error: statusItem.errorMessage || undefined,
            progress,
          })
        })
      } catch (error) {
        console.error('Error polling statuses:', error)
      }
    }

    // Poll immediately, then every 3 seconds
    poll()
    const interval = setInterval(poll, POLL_INTERVAL)

    return () => clearInterval(interval)
  }, [items, updateItemByStatementId])

  const allComplete = items.length > 0 && items.every(
    (f) => f.status === 'completed' || f.status === 'failed'
  )

  const successCount = items.filter((f) => f.status === 'completed').length
  const failedCount = items.filter((f) => f.status === 'failed').length

  return {
    files: items,
    duplicates,
    isUploading,
    uploadError,
    addFiles,
    removeFile,
    clearAll,
    startUpload,
    retryFile,
    allComplete,
    successCount,
    failedCount,
    canUpload: items.some((f) => f.status === 'queued') && !isUploading,
    hasActiveTasks: hasActiveTasks(),
  }
}
