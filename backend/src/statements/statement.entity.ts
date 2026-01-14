import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Expense } from '../expenses/expense.entity';

export enum StatementStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('statements')
export class Statement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (user) => user.statements)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'upload_date', type: 'timestamp' })
  uploadDate: Date;

  @Column({ name: 'statement_date', type: 'date', nullable: true })
  statementDate: Date;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate: Date;

  @Column({ name: 'total_ars', type: 'decimal', precision: 12, scale: 2, nullable: true })
  totalArs: number;

  @Column({ name: 'total_usd', type: 'decimal', precision: 12, scale: 2, nullable: true })
  totalUsd: number;

  @Column({ name: 'original_filename' })
  originalFilename: string;

  @Column({ name: 'file_path' })
  filePath: string;

  @Column({
    type: 'enum',
    enum: StatementStatus,
    default: StatementStatus.PENDING,
  })
  status: StatementStatus;

  @Column({ name: 'error_message', type: 'varchar', nullable: true })
  errorMessage: string | null;

  @Column({ name: 'file_hash', type: 'varchar', nullable: true })
  fileHash: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => Expense, (expense) => expense.statement)
  expenses: Expense[];
}
