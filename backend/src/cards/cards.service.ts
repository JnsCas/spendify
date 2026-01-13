import { Injectable, NotFoundException } from '@nestjs/common';
import { Card } from './card.entity';
import { CardRepository, CreateCardData } from './card.repository';

export interface CreateCardDto {
  userId: string;
  cardName?: string;
  lastFourDigits?: string;
  isExtension?: boolean;
  holderName?: string;
}

@Injectable()
export class CardsService {
  constructor(private readonly cardRepository: CardRepository) {}

  async create(data: CreateCardDto): Promise<Card> {
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

  async findOrCreateByIdentifier(
    userId: string,
    identifier: string,
  ): Promise<Card> {
    // Try to find by last four digits or holder name
    let card = await this.cardRepository.findByIdentifier(userId, identifier);

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
    await this.cardRepository.remove(card);
  }
}
