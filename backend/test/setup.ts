// Unit test setup
import { config } from 'dotenv';
import * as path from 'path';

// Load test environment variables
config({ path: path.resolve(__dirname, '.env.test') });

// Increase timeout for unit tests
jest.setTimeout(10000);

// Ensure test environment
process.env.NODE_ENV = 'test';
