import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Card } from './card.entity';

export interface CreateCardData {
  userId: string;
  lastFourDigits: string;
  customName?: string;
}

@Injectable()
export class CardRepository {
  constructor(
    @InjectRepository(Card)
    private readonly repository: Repository<Card>,
  ) {}

  async create(data: CreateCardData): Promise<Card> {
    const card = this.repository.create(data);
    return this.repository.save(card);
  }

  async findByUser(userId: string): Promise<Card[]> {
    return this.repository.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Card | null> {
    return this.repository.findOne({
      where: { id, userId },
    });
  }

  async findByLastFourDigits(userId: string, lastFourDigits: string): Promise<Card | null> {
    return this.repository.findOne({
      where: { userId, lastFourDigits },
    });
  }

  async update(card: Card): Promise<Card> {
    return this.repository.save(card);
  }
}
