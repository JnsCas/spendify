import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CardRepository } from '../../src/cards/card.repository';
import { Card } from '../../src/cards/card.entity';
import { createMockRepository, MockRepository } from '../utils/mock-repository';
import { createMockCard } from '../utils/factories';

describe('CardRepository', () => {
  let repository: CardRepository;
  let typeOrmRepository: MockRepository<Card>;

  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CardRepository,
        {
          provide: getRepositoryToken(Card),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    repository = module.get<CardRepository>(CardRepository);
    typeOrmRepository = module.get(getRepositoryToken(Card));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and save a card', async () => {
      const cardData = {
        userId: mockUserId,
        cardName: 'Test Visa',
        lastFourDigits: '1234',
      };
      const mockCard = createMockCard(cardData);

      typeOrmRepository.create!.mockReturnValue(mockCard);
      typeOrmRepository.save!.mockResolvedValue(mockCard);

      const result = await repository.create(cardData);

      expect(typeOrmRepository.create).toHaveBeenCalledWith(cardData);
      expect(typeOrmRepository.save).toHaveBeenCalledWith(mockCard);
      expect(result).toEqual(mockCard);
    });
  });

  describe('findByUser', () => {
    it('should find all cards for a user', async () => {
      const mockCards = [createMockCard({ userId: mockUserId })];
      typeOrmRepository.find!.mockResolvedValue(mockCards);

      const result = await repository.findByUser(mockUserId);

      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        order: { createdAt: 'ASC' },
      });
      expect(result).toEqual(mockCards);
    });
  });

  describe('findOne', () => {
    it('should find a card by id and userId', async () => {
      const mockCard = createMockCard({ userId: mockUserId });
      typeOrmRepository.findOne!.mockResolvedValue(mockCard);

      const result = await repository.findOne(mockCard.id, mockUserId);

      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockCard.id, userId: mockUserId },
      });
      expect(result).toEqual(mockCard);
    });

    it('should return null if not found', async () => {
      typeOrmRepository.findOne!.mockResolvedValue(null);

      const result = await repository.findOne('nonexistent', mockUserId);

      expect(result).toBeNull();
    });
  });

  describe('findByIdentifier', () => {
    it('should find card by last four digits or holder name', async () => {
      const mockCard = createMockCard({ lastFourDigits: '1234' });
      typeOrmRepository.findOne!.mockResolvedValue(mockCard);

      const result = await repository.findByIdentifier(mockUserId, '1234');

      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: [
          { userId: mockUserId, lastFourDigits: '1234' },
          { userId: mockUserId, holderName: '1234' },
        ],
      });
      expect(result).toEqual(mockCard);
    });
  });

  describe('remove', () => {
    it('should remove a card', async () => {
      const mockCard = createMockCard();
      typeOrmRepository.remove!.mockResolvedValue(mockCard);

      await repository.remove(mockCard);

      expect(typeOrmRepository.remove).toHaveBeenCalledWith(mockCard);
    });
  });
});
