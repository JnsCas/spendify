// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock next/navigation
const mockRouter = {
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
}

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}))

// Export mock router for tests to access
global.__mockRouter = mockRouter

// Mock localStorage - store data and track calls
const localStorageData = new Map()
const localStorageMock = {
  getItem: jest.fn((key) => localStorageData.get(key) ?? null),
  setItem: jest.fn((key, value) => localStorageData.set(key, value)),
  removeItem: jest.fn((key) => localStorageData.delete(key)),
  clear: jest.fn(() => localStorageData.clear()),
  get length() {
    return localStorageData.size
  },
  key: jest.fn((index) => Array.from(localStorageData.keys())[index] ?? null),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return []
  }
  unobserve() {}
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock pdfjs-dist - used by PdfRedactor component
jest.mock('pdfjs-dist', () => ({
  __esModule: true,
  default: {},
  GlobalWorkerOptions: {
    workerSrc: '',
  },
  getDocument: jest.fn(() => ({
    promise: Promise.resolve({
      numPages: 1,
      getPage: jest.fn(() => Promise.resolve({
        getViewport: jest.fn(() => ({ width: 800, height: 600 })),
        render: jest.fn(() => ({ promise: Promise.resolve() })),
      })),
    }),
  })),
}))

// Mock pdf-lib - used by PdfRedactor component
jest.mock('pdf-lib', () => ({
  __esModule: true,
  PDFDocument: {
    load: jest.fn(() => Promise.resolve({
      getPages: jest.fn(() => [{
        getSize: jest.fn(() => ({ width: 800, height: 600 })),
        drawRectangle: jest.fn(),
      }]),
      save: jest.fn(() => Promise.resolve(new Uint8Array())),
    })),
  },
  rgb: jest.fn(() => ({ r: 0, g: 0, b: 0 })),
}))
