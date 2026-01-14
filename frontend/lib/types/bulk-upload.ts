export type UploadStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface BulkUploadStatement {
  id: string
  originalFilename: string
  status: UploadStatus
}

export interface DuplicateFile {
  originalFilename: string
  existingStatementId: string
  existingFilename: string
}

export interface BulkUploadResponse {
  statements: BulkUploadStatement[]
  duplicates: DuplicateFile[]
  totalQueued: number
}

export interface StatementStatusItem {
  id: string
  status: UploadStatus
  errorMessage: string | null
}

export interface StatementStatusResponse {
  statuses: StatementStatusItem[]
}

export interface HasStatementsResponse {
  hasStatements: boolean
}

export type FileUploadStatus =
  | 'queued'
  | 'uploading'
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'

export interface FileUploadItem {
  localId: string
  file: File
  statementId?: string
  status: FileUploadStatus
  error?: string
  progress: number
}
