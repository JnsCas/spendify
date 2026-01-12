import { Repository, ObjectLiteral } from 'typeorm';

/**
 * Creates a mock TypeORM repository with common methods
 */
export type MockRepository<T extends ObjectLiteral = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

export const createMockRepository = <T extends ObjectLiteral = any>(): MockRepository<T> => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  findAndCount: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(),
  count: jest.fn(),
});
