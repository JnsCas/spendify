import { DataSource, DataSourceOptions } from 'typeorm';
import { User } from '../users/user.entity';
import { Card } from '../cards/card.entity';
import { Statement } from '../statements/statement.entity';
import { Expense } from '../expenses/expense.entity';
import { InviteCode } from '../invite-codes/invite-code.entity';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'spendify',
  password: process.env.DATABASE_PASSWORD || 'spendify123',
  database: process.env.DATABASE_NAME || 'spendify',
  entities: [User, Card, Statement, Expense, InviteCode],
  synchronize: ['development', 'test'].includes(process.env.NODE_ENV || ''),
  logging: false,
};

export const dataSource = new DataSource(dataSourceOptions);
