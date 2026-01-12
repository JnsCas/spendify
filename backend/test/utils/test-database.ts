import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';

/**
 * Database utilities for integration tests
 */

export class TestDatabase {
  private dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  /**
   * Clear all tables in the database
   */
  async cleanup(): Promise<void> {
    const entities = this.dataSource.entityMetadatas;

    // Disable foreign key checks
    await this.dataSource.query('SET session_replication_role = replica;');

    // Truncate all tables (skip if table doesn't exist)
    for (const entity of entities) {
      try {
        await this.dataSource.query(`TRUNCATE TABLE "${entity.tableName}" CASCADE;`);
      } catch (error: any) {
        // Ignore "relation does not exist" errors
        if (!error.message?.includes('does not exist')) {
          throw error;
        }
      }
    }

    // Re-enable foreign key checks
    await this.dataSource.query('SET session_replication_role = DEFAULT;');
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.dataSource.isInitialized) {
      await this.dataSource.destroy();
    }
  }
}

/**
 * Create a test database connection
 */
export const createTestDataSource = async (configService: ConfigService): Promise<DataSource> => {
  const dataSource = new DataSource({
    type: 'postgres',
    host: configService.get('DATABASE_HOST', 'localhost'),
    port: configService.get<number>('DATABASE_PORT', 5432),
    username: configService.get('DATABASE_USER', 'spendify'),
    password: configService.get('DATABASE_PASSWORD', 'spendify123'),
    database: configService.get('DATABASE_NAME', 'spendify_test'),
    entities: [__dirname + '/../../src/**/*.entity{.ts,.js}'],
    synchronize: true, // Auto-create schema for tests
    logging: false,
    dropSchema: false, // Don't drop schema automatically
  });

  await dataSource.initialize();
  return dataSource;
};
