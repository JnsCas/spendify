import { Injectable, NotFoundException } from '@nestjs/common';
import { Card } from './card.entity';
import { CardRepository, CreateCardData } from './card.repository';

@Injectable()
export class CardsService {
  constructor(private readonly cardRepository: CardRepository) {}

  async create(data: CreateCardData): Promise<Card> {
    return this.cardRepository.create(data);
  }

  async findByUser(userId: string): Promise<Card[]> {
    return this.cardRepository.findByUser(userId);
  }

  async findOne(id: string, userId: string): Promise<Card> {
    const card = await this.cardRepository.findOne(id, userId);

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    return card;
  }

  async findOrCreateByLastFourDigits(
    userId: string,
    lastFourDigits: string,
  ): Promise<Card> {
    let card = await this.cardRepository.findByLastFourDigits(userId, lastFourDigits);
    if (!card) {
      card = await this.create({ userId, lastFourDigits });
    }
    return card;
  }

  async update(id: string, userId: string, customName: string): Promise<Card> {
    const card = await this.findOne(id, userId);
    return this.cardRepository.update(card.update(customName));
  }
}
