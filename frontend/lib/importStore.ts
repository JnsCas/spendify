import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { FileUploadStatus, DuplicateFile } from './types/bulk-upload'

/**
 * Import item stored in Zustand - does NOT include File object (not serializable)
 * File objects are kept in local state in useBulkUpload hook
 */
export interface ImportItem {
  localId: string
  filename: string
  fileSize: number
  statementId?: string
  status: FileUploadStatus
  error?: string
  progress: number
}

interface ImportState {
  items: ImportItem[]
  duplicates: DuplicateFile[]
  isUploading: boolean
  uploadError: string | null

  // Actions
  addItems: (items: ImportItem[]) => void
  updateItem: (localId: string, updates: Partial<ImportItem>) => void
  updateItemByStatementId: (statementId: string, updates: Partial<ImportItem>) => void
  removeItem: (localId: string) => void
  clearAll: () => void
  setUploading: (isUploading: boolean) => void
  setError: (error: string | null) => void
  setDuplicates: (duplicates: DuplicateFile[]) => void
  clearDuplicates: () => void

  // Computed helpers
  getPendingOrProcessingIds: () => string[]
  hasActiveTasks: () => boolean
}

export const useImportStore = create<ImportState>()(
  persist(
    (set, get) => ({
      items: [],
      duplicates: [],
      isUploading: false,
      uploadError: null,

      addItems: (newItems) => {
        set((state) => ({
          items: [...state.items, ...newItems],
        }))
      },

      updateItem: (localId, updates) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.localId === localId ? { ...item, ...updates } : item
          ),
        }))
      },

      updateItemByStatementId: (statementId, updates) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.statementId === statementId ? { ...item, ...updates } : item
          ),
        }))
      },

      removeItem: (localId) => {
        set((state) => ({
          items: state.items.filter((item) => item.localId !== localId),
        }))
      },

      clearAll: () => {
        set({ items: [], duplicates: [], uploadError: null })
      },

      setUploading: (isUploading) => {
        set({ isUploading })
      },

      setError: (error) => {
        set({ uploadError: error })
      },

      setDuplicates: (duplicates) => {
        set({ duplicates })
      },

      clearDuplicates: () => {
        set({ duplicates: [] })
      },

      getPendingOrProcessingIds: () => {
        const { items } = get()
        return items
          .filter(
            (item) =>
              item.statementId &&
              (item.status === 'pending' || item.status === 'processing')
          )
          .map((item) => item.statementId!)
      },

      hasActiveTasks: () => {
        const { items, isUploading } = get()
        if (isUploading) return true
        return items.some(
          (item) =>
            item.status === 'queued' ||
            item.status === 'uploading' ||
            item.status === 'pending' ||
            item.status === 'processing'
        )
      },
    }),
    {
      name: 'import-store',
      partialize: (state) => ({
        // Only persist items that are still processing (have statementId and are pending/processing)
        items: state.items.filter(
          (item) =>
            item.statementId &&
            (item.status === 'pending' || item.status === 'processing')
        ),
        // Don't persist duplicates, isUploading, or uploadError
      }),
    }
  )
)
