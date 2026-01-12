// Integration test setup
import { config } from 'dotenv';
import * as path from 'path';

// Load test environment variables
config({ path: path.resolve(__dirname, '../.env.test') });

// Increase timeout for integration tests
jest.setTimeout(30000);

// Set test environment variables if not already set
process.env.NODE_ENV = 'test';
process.env.DATABASE_NAME = process.env.DATABASE_NAME || 'spendify_test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
process.env.JWT_EXPIRATION = process.env.JWT_EXPIRATION || '1h';
process.env.ADMIN_EMAILS = process.env.ADMIN_EMAILS || 'admin@test.com';
process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || 'test-api-key';
process.env.ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307';
