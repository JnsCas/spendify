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

@Entity('cards')
export class Card {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (user) => user.cards)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'card_name', nullable: true })
  cardName: string;

  @Column({ name: 'last_four_digits', nullable: true })
  lastFourDigits: string;

  @Column({ name: 'is_extension', default: false })
  isExtension: boolean;

  @Column({ name: 'holder_name', nullable: true })
  holderName: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => Expense, (expense) => expense.card)
  expenses: Expense[];
}
