import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'

// Default mock router values
export const defaultMockRouter: AppRouterInstance = {
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
}

// Create a mock router with optional overrides
export const createMockRouter = (overrides?: Partial<AppRouterInstance>): AppRouterInstance => ({
  ...defaultMockRouter,
  ...overrides,
})

// State for the mocked values - can be updated by tests
export const mockNavigationState = {
  router: defaultMockRouter,
  pathname: '/',
  searchParams: new URLSearchParams(),
}

// Functions to update mock state for tests
export const setMockRouter = (router: Partial<AppRouterInstance>) => {
  mockNavigationState.router = createMockRouter(router)
  return mockNavigationState.router
}

export const setMockPathname = (pathname: string) => {
  mockNavigationState.pathname = pathname
}

export const setMockSearchParams = (params: Record<string, string>) => {
  mockNavigationState.searchParams = new URLSearchParams(params)
}

// Reset all mocks to defaults
export const resetNavigationMocks = () => {
  mockNavigationState.router = createMockRouter()
  mockNavigationState.pathname = '/'
  mockNavigationState.searchParams = new URLSearchParams()
  jest.clearAllMocks()
}
