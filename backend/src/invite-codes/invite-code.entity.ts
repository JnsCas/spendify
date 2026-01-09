import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum InviteCodeStatus {
  AVAILABLE = 'available',
  USED = 'used',
}

@Entity('invite_codes')
export class InviteCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 8 })
  code: string;

  @Column({
    type: 'enum',
    enum: InviteCodeStatus,
    default: InviteCodeStatus.AVAILABLE,
  })
  status: InviteCodeStatus;

  @Column({ name: 'used_by_id', nullable: true })
  usedById: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'used_by_id' })
  usedBy: User | null;

  @Column({ name: 'used_at', type: 'timestamp', nullable: true })
  usedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
