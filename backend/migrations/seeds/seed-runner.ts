import type { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { dataSource } from '../../src/config/data-source';

async function runSeeds() {
  const seedsDir = __dirname;
  const files = fs.readdirSync(seedsDir);

  // Filter seed files (numbered .ts files, exclude runner and .js files)
  const seedFiles = files
    .filter((f) => /^\d+.*\.ts$/.test(f) && !f.endsWith('.d.ts'))
    .sort((a, b) => {
      const numA = parseInt(a.split('-')[0], 10);
      const numB = parseInt(b.split('-')[0], 10);
      return numA - numB;
    });

  if (seedFiles.length === 0) {
    console.log('No seed files found.');
    return;
  }

  console.log(`Found ${seedFiles.length} seed file(s):\n`);
    
  console.log('Connecting to database...');
  await dataSource.initialize();
  console.log('Connected!\n');

  for (const file of seedFiles) {
    const seedName = file.replace('.ts', '');
    console.log(`Running: ${seedName}`);
    console.log('-'.repeat(50));

    try {
      const seedModule = await import(path.join(seedsDir, file));
      if (typeof seedModule.default === 'function') {
        await seedModule.default(dataSource);
      } else if (typeof seedModule.seed === 'function') {
        await seedModule.seed(dataSource);
      } else {
        console.log(`  Skipped: No default or seed export found`);
      }
    } catch (error) {
      console.error(`  Error in ${seedName}:`, error);
      throw error;
    }

    console.log('');
  }

  console.log('All seeds completed!');
  await dataSource.destroy();
}

runSeeds().catch((error) => {
  console.error('Seed runner failed:', error);
  process.exit(1);
});
