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

  constructor(id: string, userId: string, customName: string, lastFourDigits: string, createdAt: Date) {
    this.id = id;
    this.userId = userId;
    this.customName = customName;
    this.lastFourDigits = lastFourDigits;
    this.createdAt = createdAt;
  }

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (user) => user.cards)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'custom_name', nullable: true })
  customName: string;

  @Column({ name: 'last_four_digits', nullable: true })
  lastFourDigits: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => Expense, (expense) => expense.card)
  expenses: Expense[];

  update(customName: string): Card {
    return new Card(this.id, this.userId, customName, this.lastFourDigits, this.createdAt);
  }
}
