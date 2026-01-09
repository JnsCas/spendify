import axios from 'axios'

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
  register: async (email: string, password: string, name: string) => {
    const { data } = await api.post('/auth/register', { email, password, name })
    return data
  },
}

// Statements API
export const statementsApi = {
  getAll: async () => {
    const { data } = await api.get('/statements')
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
}

// Cards API
export const cardsApi = {
  getAll: async () => {
    const { data } = await api.get('/cards')
    return data
  },
}
