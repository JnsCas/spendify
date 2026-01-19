import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { TestApp } from '../utils/test-app';
import { InviteCodesService } from '../../src/invite-codes/invite-codes.service';
import { Card } from '../../src/cards/card.entity';

describe('Cards (e2e)', () => {
  let app: INestApplication;
  let testApp: TestApp;
  let inviteCodesService: InviteCodesService;
  let dataSource: DataSource;
  let accessToken: string;
  let userId: string;

  beforeAll(async () => {
    testApp = new TestApp();
    app = await testApp.initialize();
    inviteCodesService = testApp.get<InviteCodesService>(InviteCodesService);
    dataSource = testApp.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    await testApp.close();
  });

  beforeEach(async () => {
    await testApp.cleanup();

    // Create and login a test user
    const inviteCode = await inviteCodesService.generate();

    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'testuser@example.com',
        password: 'password123',
        name: 'Test User',
        inviteCode: inviteCode.code,
      });

    accessToken = registerResponse.body.accessToken;
    userId = registerResponse.body.user.id;
  });

  // Helper function to create a card directly in the database
  async function createCard(overrides: Partial<Card> = {}): Promise<Card> {
    const cardRepo = dataSource.getRepository(Card);
    const card = cardRepo.create({
      userId,
      customName: 'Visa',
      lastFourDigits: '1234',
      ...overrides,
    });
    return cardRepo.save(card);
  }

  describe('GET /cards', () => {
    it('should return all cards for user', async () => {
      await createCard({ customName: 'Visa', lastFourDigits: '1234' });
      await createCard({ customName: 'Mastercard', lastFourDigits: '5678' });

      const response = await request(app.getHttpServer())
        .get('/cards')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body.map((c: Card) => c.customName)).toContain('Visa');
      expect(response.body.map((c: Card) => c.customName)).toContain(
        'Mastercard',
      );
    });

    it('should return empty array when user has no cards', async () => {
      const response = await request(app.getHttpServer())
        .get('/cards')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should not return other users cards', async () => {
      // Create card for current user
      await createCard({ customName: 'My Card' });

      // Create another user and their card
      const inviteCode = await inviteCodesService.generate();
      const otherUserResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'otheruser@example.com',
          password: 'password123',
          name: 'Other User',
          inviteCode: inviteCode.code,
        });

      const otherUserId = otherUserResponse.body.user.id;
      const cardRepo = dataSource.getRepository(Card);
      await cardRepo.save(
        cardRepo.create({
          userId: otherUserId,
          customName: 'Other Card',
          lastFourDigits: '9999',
        }),
      );

      const response = await request(app.getHttpServer())
        .get('/cards')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].customName).toBe('My Card');
    });

    it('should reject request without authentication', async () => {
      await request(app.getHttpServer()).get('/cards').expect(401);
    });
  });

  describe('GET /cards/:id', () => {
    it('should return a single card', async () => {
      const card = await createCard({ customName: 'Visa', lastFourDigits: '1234' });

      const response = await request(app.getHttpServer())
        .get(`/cards/${card.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.id).toBe(card.id);
      expect(response.body.customName).toBe('Visa');
      expect(response.body.lastFourDigits).toBe('1234');
    });

    it('should return 404 for non-existent card', async () => {
      await request(app.getHttpServer())
        .get('/cards/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should return 404 for another users card', async () => {
      // Create another user and their card
      const inviteCode = await inviteCodesService.generate();
      const otherUserResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'otheruser2@example.com',
          password: 'password123',
          name: 'Other User',
          inviteCode: inviteCode.code,
        });

      const otherUserId = otherUserResponse.body.user.id;
      const cardRepo = dataSource.getRepository(Card);
      const otherCard = await cardRepo.save(
        cardRepo.create({
          userId: otherUserId,
          customName: 'Other Card',
          lastFourDigits: '9999',
        }),
      );

      await request(app.getHttpServer())
        .get(`/cards/${otherCard.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should reject request without authentication', async () => {
      const card = await createCard();

      await request(app.getHttpServer()).get(`/cards/${card.id}`).expect(401);
    });
  });

  describe('PATCH /cards/:id', () => {
    it('should update card custom name', async () => {
      const card = await createCard({ customName: 'Old Name' });

      const response = await request(app.getHttpServer())
        .patch(`/cards/${card.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ customName: 'New Name' })
        .expect(200);

      expect(response.body.id).toBe(card.id);
      expect(response.body.customName).toBe('New Name');

      // Verify in database
      const cardRepo = dataSource.getRepository(Card);
      const updatedCard = await cardRepo.findOne({ where: { id: card.id } });
      expect(updatedCard!.customName).toBe('New Name');
    });

    it('should preserve other fields when updating', async () => {
      const card = await createCard({
        customName: 'Old Name',
        lastFourDigits: '1234',
      });

      const response = await request(app.getHttpServer())
        .patch(`/cards/${card.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ customName: 'New Name' })
        .expect(200);

      expect(response.body.lastFourDigits).toBe('1234');
      expect(response.body.userId).toBe(userId);
    });

    it('should return 404 for non-existent card', async () => {
      await request(app.getHttpServer())
        .patch('/cards/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ customName: 'New Name' })
        .expect(404);
    });

    it('should return 404 when updating another users card', async () => {
      // Create another user and their card
      const inviteCode = await inviteCodesService.generate();
      const otherUserResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'otheruser-update@example.com',
          password: 'password123',
          name: 'Other User',
          inviteCode: inviteCode.code,
        });

      const otherUserId = otherUserResponse.body.user.id;
      const cardRepo = dataSource.getRepository(Card);
      const otherCard = await cardRepo.save(
        cardRepo.create({
          userId: otherUserId,
          customName: 'Other Card',
          lastFourDigits: '9999',
        }),
      );

      await request(app.getHttpServer())
        .patch(`/cards/${otherCard.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ customName: 'Hacked Name' })
        .expect(404);

      // Verify card was not modified
      const unchangedCard = await cardRepo.findOne({
        where: { id: otherCard.id },
      });
      expect(unchangedCard!.customName).toBe('Other Card');
    });

    it('should reject request without customName', async () => {
      const card = await createCard();

      await request(app.getHttpServer())
        .patch(`/cards/${card.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(400);
    });

    it('should reject request with non-string customName', async () => {
      const card = await createCard();

      await request(app.getHttpServer())
        .patch(`/cards/${card.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ customName: 123 })
        .expect(400);
    });

    it('should reject customName exceeding max length', async () => {
      const card = await createCard();
      const longName = 'a'.repeat(101);

      await request(app.getHttpServer())
        .patch(`/cards/${card.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ customName: longName })
        .expect(400);
    });

    it('should reject request without authentication', async () => {
      const card = await createCard();

      await request(app.getHttpServer())
        .patch(`/cards/${card.id}`)
        .send({ customName: 'New Name' })
        .expect(401);
    });
  });
});
