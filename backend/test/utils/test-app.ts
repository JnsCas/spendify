import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { TestDatabase } from './test-database';

/**
 * Creates a NestJS application instance for integration testing
 */
export class TestApp {
  private app: INestApplication;
  private moduleFixture: TestingModule;
  private testDatabase: TestDatabase;

  async initialize(): Promise<INestApplication> {
    this.moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ConfigService)
      .useValue(this.createTestConfigService())
      .compile();

    this.app = this.moduleFixture.createNestApplication();

    // Apply the same global pipes as production
    this.app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      })
    );

    await this.app.init();

    // Get database connection for cleanup
    const dataSource = this.app.get(DataSource);
    this.testDatabase = new TestDatabase(dataSource);

    return this.app;
  }

  async cleanup(): Promise<void> {
    if (this.testDatabase) {
      await this.testDatabase.cleanup();
    }
  }

  async close(): Promise<void> {
    if (this.app) {
      await this.app.close();
    }
  }

  getApp(): INestApplication {
    return this.app;
  }

  get<T>(token: any): T {
    return this.moduleFixture.get<T>(token);
  }

  private createTestConfigService(): Partial<ConfigService> {
    return {
      get: (key: string, defaultValue?: any) => {
        const config: Record<string, any> = {
          NODE_ENV: 'test',
          PORT: 3002,
          DATABASE_HOST: process.env.DATABASE_HOST || 'localhost',
          DATABASE_PORT: parseInt(process.env.DATABASE_PORT || '5432'),
          DATABASE_USER: process.env.DATABASE_USER || 'spendify',
          DATABASE_PASSWORD: process.env.DATABASE_PASSWORD || 'spendify123',
          DATABASE_NAME: process.env.DATABASE_NAME || 'spendify_test',
          REDIS_HOST: process.env.REDIS_HOST || 'localhost',
          REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379'),
          JWT_SECRET: 'test-jwt-secret',
          JWT_EXPIRATION: '1h',
          ADMIN_EMAILS: 'admin@test.com',
          ANTHROPIC_API_KEY: 'test-api-key',
          ANTHROPIC_MODEL: 'claude-3-haiku-20240307',
        };
        return config[key] ?? defaultValue;
      },
    };
  }
}
