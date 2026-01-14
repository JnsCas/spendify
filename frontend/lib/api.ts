import axios from 'axios'
import type {
  BulkUploadResponse,
  StatementStatusResponse,
  HasStatementsResponse,
} from './types/bulk-upload'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password })
    return data
  },
  register: async (email: string, password: string, name: string, inviteCode: string) => {
    const { data } = await api.post('/auth/register', { email, password, name, inviteCode })
    return data
  },
  me: async () => {
    const { data } = await api.get('/auth/me')
    return data
  },
}

// Statements API
export const statementsApi = {
  getAll: async (year?: number, month?: number) => {
    const params = new URLSearchParams()
    if (year) params.append('year', year.toString())
    if (month) params.append('month', month.toString())
    const query = params.toString()
    const { data } = await api.get(`/statements${query ? `?${query}` : ''}`)
    return data
  },
  getSummary: async (year?: number) => {
    const params = year ? `?year=${year}` : ''
    const { data } = await api.get(`/statements/summary${params}`)
    return data
  },
  getOne: async (id: string) => {
    const { data } = await api.get(`/statements/${id}`)
    return data
  },
  upload: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await api.post('/statements/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },
  reprocess: async (id: string) => {
    const { data } = await api.post(`/statements/${id}/reprocess`)
    return data
  },
  delete: async (id: string) => {
    await api.delete(`/statements/${id}`)
  },
  exportCsv: (id: string) => {
    return `${API_URL}/api/statements/${id}/export/csv`
  },
  uploadBulk: async (files: File[]): Promise<BulkUploadResponse> => {
    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))
    const { data } = await api.post('/statements/upload-bulk', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },
  getStatuses: async (ids: string[]): Promise<StatementStatusResponse> => {
    const { data } = await api.get(`/statements/status?ids=${ids.join(',')}`)
    return data
  },
  hasAny: async (): Promise<HasStatementsResponse> => {
    const { data } = await api.get('/statements/has-any')
    return data
  },
  getProcessing: async () => {
    const { data } = await api.get('/statements/processing')
    return data
  },
}

// Cards API
export const cardsApi = {
  getAll: async () => {
    const { data } = await api.get('/cards')
    return data
  },
}

// Invite Codes API (Admin only)
export const inviteCodesApi = {
  getAll: async () => {
    const { data } = await api.get('/invite-codes')
    return data
  },
  generate: async () => {
    const { data } = await api.post('/invite-codes')
    return data
  },
  delete: async (id: string) => {
    await api.delete(`/invite-codes/${id}`)
  },
}
