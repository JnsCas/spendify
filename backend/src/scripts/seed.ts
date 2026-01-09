import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/user.entity';
import { Card } from '../cards/card.entity';
import { Statement } from '../statements/statement.entity';
import { Expense } from '../expenses/expense.entity';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'spendify',
  password: process.env.DATABASE_PASSWORD || 'spendify123',
  database: process.env.DATABASE_NAME || 'spendify',
  entities: [User, Card, Statement, Expense],
  synchronize: true,
});

async function seed() {
  console.log('Connecting to database...');
  await dataSource.initialize();

  const userRepository = dataSource.getRepository(User);

  // Check if test user already exists
  const existingUser = await userRepository.findOne({
    where: { email: 'test@example.com' },
  });

  if (existingUser) {
    console.log('Test user already exists:');
    console.log('  Email: test@example.com');
    console.log('  Password: password123');
    await dataSource.destroy();
    return;
  }

  // Create test user
  const passwordHash = await bcrypt.hash('password123', 10);
  const user = userRepository.create({
    email: 'test@example.com',
    passwordHash,
    name: 'Test User',
  });

  await userRepository.save(user);

  console.log('Test user created successfully:');
  console.log('  Email: test@example.com');
  console.log('  Password: password123');

  await dataSource.destroy();
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
