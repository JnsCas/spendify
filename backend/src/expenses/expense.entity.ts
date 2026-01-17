import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Statement } from '../statements/statement.entity';
import { Card } from '../cards/card.entity';

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'statement_id' })
  statementId: string;

  @ManyToOne(() => Statement, (statement) => statement.expenses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'statement_id' })
  statement: Statement;

  @Column({ name: 'card_id', nullable: true })
  cardId: string;

  @ManyToOne(() => Card, (card) => card.expenses, { nullable: true })
  @JoinColumn({ name: 'card_id' })
  card: Card;

  @Column()
  description: string;

  @Column({ name: 'amount_ars', type: 'decimal', precision: 12, scale: 2, nullable: true })
  amountArs: number;

  @Column({ name: 'amount_usd', type: 'decimal', precision: 12, scale: 2, nullable: true })
  amountUsd: number;

  @Column({ name: 'current_installment', nullable: true })
  currentInstallment: number;

  @Column({ name: 'total_installments', nullable: true })
  totalInstallments: number;

  @Column({ name: 'purchase_date', type: 'date', nullable: true })
  purchaseDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
