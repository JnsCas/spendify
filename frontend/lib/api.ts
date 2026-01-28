import axios from 'axios'
import type {
  BulkUploadResponse,
  StatementStatusResponse,
  HasStatementsResponse,
} from './types/bulk-upload'
import type { Card, UpdateCardDto } from './types/card'
import type { CompletingInstallmentsResponse } from './types/dashboard'
import type { MonthExpensesResponse } from './types/expense'
import type { InstallmentsResponse } from './types/installments'

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
  getAll: async (endYear?: number, endMonth?: number) => {
    const params = new URLSearchParams()
    if (endYear) params.append('endYear', endYear.toString())
    if (endMonth) params.append('endMonth', endMonth.toString())
    const query = params.toString()
    const { data } = await api.get(`/statements${query ? `?${query}` : ''}`)
    return data
  },
  getSummary: async (endYear?: number, endMonth?: number) => {
    const params = new URLSearchParams()
    if (endYear) params.append('endYear', endYear.toString())
    if (endMonth) params.append('endMonth', endMonth.toString())
    const query = params.toString()
    const { data } = await api.get(`/statements/summary${query ? `?${query}` : ''}`)
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
  getCompletingInstallments: async (
    year: number,
    month: number
  ): Promise<CompletingInstallmentsResponse> => {
    const { data } = await api.get(
      `/statements/completing-installments?year=${year}&month=${month}`
    )
    return data
  },
}

// Expenses API
export const expensesApi = {
  getByMonth: async (year: number, month: number): Promise<MonthExpensesResponse> => {
    const { data } = await api.get(`/expenses/by-month?year=${year}&month=${month}`)
    return data
  },
  exportCsvByMonth: (year: number, month: number) => {
    return `${API_URL}/api/expenses/export/by-month?year=${year}&month=${month}`
  },
}

// Installments API
export const installmentsApi = {
  getAll: async (): Promise<InstallmentsResponse> => {
    const { data } = await api.get('/expenses/installments')
    return data
  },
}

// Statements by month API
export const statementsByMonthApi = {
  deleteByMonth: async (year: number, month: number): Promise<{ deletedCount: number }> => {
    const { data } = await api.delete(`/statements/by-month?year=${year}&month=${month}`)
    return data
  },
}

// Cards API
export const cardsApi = {
  getAll: async (): Promise<Card[]> => {
    const { data } = await api.get('/cards')
    return data
  },
  update: async (id: string, dto: UpdateCardDto): Promise<Card> => {
    const { data } = await api.patch(`/cards/${id}`, dto)
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

// Users API
export interface ProfileResponse {
  id: string
  email: string
  name: string
  language: string
}

export interface UpdateProfileDto {
  language?: string
}

export const usersApi = {
  getProfile: async (): Promise<ProfileResponse> => {
    const { data } = await api.get('/users/profile')
    return data
  },
  updateProfile: async (dto: UpdateProfileDto): Promise<ProfileResponse> => {
    const { data } = await api.patch('/users/profile', dto)
    return data
  },
}
