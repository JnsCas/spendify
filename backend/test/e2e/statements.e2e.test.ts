import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { TestApp } from '../utils/test-app';
import { InviteCodesService } from '../../src/invite-codes/invite-codes.service';
import { Statement, StatementStatus } from '../../src/statements/statement.entity';
import { Expense } from '../../src/expenses/expense.entity';
import { Card } from '../../src/cards/card.entity';

describe('Statements (e2e)', () => {
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

  // Helper function to create a statement directly in the database
  async function createStatement(
    overrides: Partial<Statement> = {},
  ): Promise<Statement> {
    const statementRepo = dataSource.getRepository(Statement);
    const statement = statementRepo.create({
      userId,
      originalFilename: 'test.pdf',
      filePath: '/uploads/test/test.pdf',
      uploadDate: new Date(),
      status: StatementStatus.COMPLETED,
      totalArs: 10000,
      totalUsd: 50,
      statementDate: new Date('2024-01-15'),
      dueDate: new Date('2024-02-01'),
      ...overrides,
    });
    return statementRepo.save(statement);
  }

  // Helper function to create a card
  async function createCard(overrides: Partial<Card> = {}): Promise<Card> {
    const cardRepo = dataSource.getRepository(Card);
    const card = cardRepo.create({
      userId,
      cardName: 'Visa',
      lastFourDigits: '1234',
      isExtension: false,
      holderName: 'TEST USER',
      ...overrides,
    });
    return cardRepo.save(card);
  }

  // Helper function to create an expense
  async function createExpense(
    statementId: string,
    cardId: string | undefined,
    overrides: Partial<Expense> = {},
  ): Promise<Expense> {
    const expenseRepo = dataSource.getRepository(Expense);
    const expense = expenseRepo.create({
      statementId,
      cardId,
      description: 'Test Expense',
      amountArs: 1000,
      amountUsd: 5,
      purchaseDate: new Date('2024-01-10'),
      ...overrides,
    });
    return expenseRepo.save(expense);
  }

  describe('GET /statements', () => {
    it('should return all statements when no query params', async () => {
      await createStatement({ statementDate: new Date('2024-01-15') });
      await createStatement({ statementDate: new Date('2024-02-15') });
      await createStatement({ statementDate: new Date('2023-06-15') });

      const response = await request(app.getHttpServer())
        .get('/statements')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveLength(3);
    });

    it('should filter statements by year query param', async () => {
      await createStatement({ statementDate: new Date('2024-01-15') });
      await createStatement({ statementDate: new Date('2024-06-15') });
      await createStatement({ statementDate: new Date('2023-06-15') });

      const response = await request(app.getHttpServer())
        .get('/statements?year=2024')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      response.body.forEach((statement: Statement) => {
        const year = new Date(statement.statementDate).getFullYear();
        expect(year).toBe(2024);
      });
    });

    it('should filter statements by year and month query params', async () => {
      await createStatement({ statementDate: new Date('2024-01-15') });
      await createStatement({ statementDate: new Date('2024-01-20') });
      await createStatement({ statementDate: new Date('2024-02-15') });
      await createStatement({ statementDate: new Date('2023-01-15') });

      const response = await request(app.getHttpServer())
        .get('/statements?year=2024&month=1')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      response.body.forEach((statement: Statement) => {
        const date = new Date(statement.statementDate);
        expect(date.getFullYear()).toBe(2024);
        expect(date.getMonth()).toBe(0); // January is 0
      });
    });

    it('should return empty array when no statements match filters', async () => {
      await createStatement({ statementDate: new Date('2024-01-15') });

      const response = await request(app.getHttpServer())
        .get('/statements?year=2020')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveLength(0);
    });

    it('should reject request without authentication', async () => {
      await request(app.getHttpServer()).get('/statements').expect(401);
    });
  });

  describe('GET /statements/summary', () => {
    it('should return summary for specified year', async () => {
      await createStatement({
        statementDate: new Date('2024-01-15'),
        totalArs: 10000,
        totalUsd: 50,
      });
      await createStatement({
        statementDate: new Date('2024-02-15'),
        totalArs: 15000,
        totalUsd: 75,
      });

      const response = await request(app.getHttpServer())
        .get('/statements/summary?year=2024')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('availableYears');
      expect(response.body).toHaveProperty('yearSummary');
      expect(response.body).toHaveProperty('cardBreakdown');
      expect(response.body.yearSummary.year).toBe(2024);
    });

    it('should return available years list', async () => {
      await createStatement({ statementDate: new Date('2024-01-15') });
      await createStatement({ statementDate: new Date('2023-06-15') });
      await createStatement({ statementDate: new Date('2022-03-15') });

      const response = await request(app.getHttpServer())
        .get('/statements/summary?year=2024')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.availableYears).toContain(2024);
      expect(response.body.availableYears).toContain(2023);
      expect(response.body.availableYears).toContain(2022);
    });

    it('should return monthly aggregates', async () => {
      await createStatement({
        statementDate: new Date('2024-01-15'),
        totalArs: 10000,
        totalUsd: 50,
      });
      await createStatement({
        statementDate: new Date('2024-01-20'),
        totalArs: 5000,
        totalUsd: 25,
      });
      await createStatement({
        statementDate: new Date('2024-03-15'),
        totalArs: 8000,
        totalUsd: 40,
      });

      const response = await request(app.getHttpServer())
        .get('/statements/summary?year=2024')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const { monthlyData } = response.body.yearSummary;

      // Find January data
      const januaryData = monthlyData.find(
        (m: { month: number }) => m.month === 1,
      );
      expect(januaryData).toBeDefined();
      expect(januaryData.totalArs).toBe(15000);
      expect(januaryData.totalUsd).toBe(75);
      expect(januaryData.statementCount).toBe(2);

      // Find March data
      const marchData = monthlyData.find(
        (m: { month: number }) => m.month === 3,
      );
      expect(marchData).toBeDefined();
      expect(marchData.totalArs).toBe(8000);
      expect(marchData.totalUsd).toBe(40);
      expect(marchData.statementCount).toBe(1);
    });

    it('should return card breakdown', async () => {
      const card1 = await createCard({
        cardName: 'Visa',
        lastFourDigits: '1234',
      });
      const card2 = await createCard({
        cardName: 'Mastercard',
        lastFourDigits: '5678',
      });

      const statement = await createStatement({
        statementDate: new Date('2024-01-15'),
      });

      await createExpense(statement.id, card1.id, {
        amountArs: 5000,
        amountUsd: 25,
      });
      await createExpense(statement.id, card1.id, {
        amountArs: 3000,
        amountUsd: 15,
      });
      await createExpense(statement.id, card2.id, {
        amountArs: 2000,
        amountUsd: 10,
      });

      const response = await request(app.getHttpServer())
        .get('/statements/summary?year=2024')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.cardBreakdown).toHaveLength(2);

      const visaBreakdown = response.body.cardBreakdown.find(
        (c: { cardName: string }) => c.cardName === 'Visa',
      );
      expect(visaBreakdown).toBeDefined();
      expect(visaBreakdown.totalArs).toBe(8000);
      expect(visaBreakdown.totalUsd).toBe(40);

      const mastercardBreakdown = response.body.cardBreakdown.find(
        (c: { cardName: string }) => c.cardName === 'Mastercard',
      );
      expect(mastercardBreakdown).toBeDefined();
      expect(mastercardBreakdown.totalArs).toBe(2000);
      expect(mastercardBreakdown.totalUsd).toBe(10);
    });

    it('should default to current year when year not specified', async () => {
      const currentYear = new Date().getFullYear();
      await createStatement({
        statementDate: new Date(`${currentYear}-01-15`),
      });

      const response = await request(app.getHttpServer())
        .get('/statements/summary')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.yearSummary.year).toBe(currentYear);
    });

    it('should return empty data for year with no statements', async () => {
      await createStatement({ statementDate: new Date('2024-01-15') });

      const response = await request(app.getHttpServer())
        .get('/statements/summary?year=2020')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.yearSummary.monthlyData).toHaveLength(0);
      expect(response.body.yearSummary.totalArs).toBe(0);
      expect(response.body.yearSummary.totalUsd).toBe(0);
    });

    it('should reject request without authentication', async () => {
      await request(app.getHttpServer())
        .get('/statements/summary?year=2024')
        .expect(401);
    });
  });
});
