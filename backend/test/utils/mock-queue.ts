import { Queue } from 'bull';

/**
 * Creates a mock BullMQ queue
 */
export type MockQueue = Partial<Record<keyof Queue, jest.Mock>>;

export const createMockQueue = (): MockQueue => ({
  add: jest.fn().mockResolvedValue({ id: 'mock-job-id' }),
  process: jest.fn(),
  getJob: jest.fn(),
  getJobs: jest.fn(),
  clean: jest.fn(),
  close: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  count: jest.fn(),
});
