import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Card } from './card.entity';

export interface CreateCardDto {
  userId: string;
  cardName?: string;
  lastFourDigits?: string;
  isExtension?: boolean;
  holderName?: string;
}

@Injectable()
export class CardsService {
  constructor(
    @InjectRepository(Card)
    private cardsRepository: Repository<Card>,
  ) {}

  async create(data: CreateCardDto): Promise<Card> {
    const card = this.cardsRepository.create(data);
    return this.cardsRepository.save(card);
  }

  async findByUser(userId: string): Promise<Card[]> {
    return this.cardsRepository.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Card> {
    const card = await this.cardsRepository.findOne({
      where: { id, userId },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    return card;
  }

  async findOrCreateByIdentifier(
    userId: string,
    identifier: string,
  ): Promise<Card> {
    // Try to find by last four digits or holder name
    let card = await this.cardsRepository.findOne({
      where: [
        { userId, lastFourDigits: identifier },
        { userId, holderName: identifier },
      ],
    });

    if (!card) {
      // Create new card
      card = await this.create({
        userId,
        lastFourDigits: identifier.length === 4 ? identifier : undefined,
        holderName: identifier.length > 4 ? identifier : undefined,
      });
    }

    return card;
  }

  async delete(id: string, userId: string): Promise<void> {
    const card = await this.findOne(id, userId);
    await this.cardsRepository.remove(card);
  }
}
