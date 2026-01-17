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

  describe('GET /statements/has-any', () => {
    it('should return false for new user with no statements', async () => {
      const response = await request(app.getHttpServer())
        .get('/statements/has-any')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toEqual({ hasStatements: false });
    });

    it('should return true after user has statements', async () => {
      await createStatement();

      const response = await request(app.getHttpServer())
        .get('/statements/has-any')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toEqual({ hasStatements: true });
    });

    it('should reject request without authentication', async () => {
      await request(app.getHttpServer())
        .get('/statements/has-any')
        .expect(401);
    });
  });

  describe('GET /statements/status', () => {
    it('should return statuses for specified IDs', async () => {
      const stmt1 = await createStatement({ status: StatementStatus.COMPLETED });
      const stmt2 = await createStatement({ status: StatementStatus.PROCESSING });
      const stmt3 = await createStatement({
        status: StatementStatus.FAILED,
        errorMessage: 'Parse error',
      });

      const ids = [stmt1.id, stmt2.id, stmt3.id].join(',');

      const response = await request(app.getHttpServer())
        .get(`/statements/status?ids=${ids}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.statuses).toHaveLength(3);

      const completedStatus = response.body.statuses.find(
        (s: { id: string }) => s.id === stmt1.id,
      );
      expect(completedStatus.status).toBe('completed');

      const failedStatus = response.body.statuses.find(
        (s: { id: string }) => s.id === stmt3.id,
      );
      expect(failedStatus.status).toBe('failed');
      expect(failedStatus.errorMessage).toBe('Parse error');
    });

    it('should not return statuses for other users statements', async () => {
      // Create statement for current user
      const ownStatement = await createStatement();

      // Create another user and their statement
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
      const statementRepo = dataSource.getRepository(Statement);
      const otherStatement = await statementRepo.save(
        statementRepo.create({
          userId: otherUserId,
          originalFilename: 'other.pdf',
          filePath: '/uploads/other/other.pdf',
          uploadDate: new Date(),
          status: StatementStatus.COMPLETED,
        }),
      );

      // Request with both IDs but only should see own
      const ids = [ownStatement.id, otherStatement.id].join(',');

      const response = await request(app.getHttpServer())
        .get(`/statements/status?ids=${ids}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.statuses).toHaveLength(1);
      expect(response.body.statuses[0].id).toBe(ownStatement.id);
    });

    it('should return empty array for non-existent IDs', async () => {
      const response = await request(app.getHttpServer())
        .get('/statements/status?ids=nonexistent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.statuses).toEqual([]);
    });

    it('should reject request without authentication', async () => {
      await request(app.getHttpServer())
        .get('/statements/status?ids=some-id')
        .expect(401);
    });
  });

  describe('GET /statements/processing', () => {
    it('should return pending and processing statements only', async () => {
      await createStatement({ status: StatementStatus.PENDING });
      await createStatement({ status: StatementStatus.PROCESSING });
      await createStatement({ status: StatementStatus.COMPLETED });
      await createStatement({ status: StatementStatus.FAILED });

      const response = await request(app.getHttpServer())
        .get('/statements/processing')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      response.body.forEach((statement: Statement) => {
        expect(['pending', 'processing']).toContain(statement.status);
      });
    });

    it('should return empty array when no pending or processing statements', async () => {
      await createStatement({ status: StatementStatus.COMPLETED });
      await createStatement({ status: StatementStatus.FAILED });

      const response = await request(app.getHttpServer())
        .get('/statements/processing')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should not return other users pending/processing statements', async () => {
      // Create pending statement for current user
      await createStatement({ status: StatementStatus.PENDING });

      // Create another user and their pending statement
      const inviteCode = await inviteCodesService.generate();
      const otherUserResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'otheruser2@example.com',
          password: 'password123',
          name: 'Other User 2',
          inviteCode: inviteCode.code,
        });

      const otherUserId = otherUserResponse.body.user.id;
      const statementRepo = dataSource.getRepository(Statement);
      await statementRepo.save(
        statementRepo.create({
          userId: otherUserId,
          originalFilename: 'other.pdf',
          filePath: '/uploads/other/other.pdf',
          uploadDate: new Date(),
          status: StatementStatus.PENDING,
        }),
      );

      const response = await request(app.getHttpServer())
        .get('/statements/processing')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].userId).toBe(userId);
    });

    it('should reject request without authentication', async () => {
      await request(app.getHttpServer())
        .get('/statements/processing')
        .expect(401);
    });
  });

  describe('DELETE /statements/:id', () => {
    it('should delete a statement without expenses', async () => {
      const statement = await createStatement();

      await request(app.getHttpServer())
        .delete(`/statements/${statement.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Verify statement is deleted
      const statementRepo = dataSource.getRepository(Statement);
      const deletedStatement = await statementRepo.findOne({
        where: { id: statement.id },
      });
      expect(deletedStatement).toBeNull();
    });

    it('should delete a statement and cascade delete its expenses', async () => {
      const card = await createCard();
      const statement = await createStatement();

      // Create multiple expenses for this statement
      await createExpense(statement.id, card.id, { description: 'Expense 1' });
      await createExpense(statement.id, card.id, { description: 'Expense 2' });
      await createExpense(statement.id, card.id, { description: 'Expense 3' });

      // Verify expenses exist before deletion
      const expenseRepo = dataSource.getRepository(Expense);
      const expensesBefore = await expenseRepo.find({
        where: { statementId: statement.id },
      });
      expect(expensesBefore).toHaveLength(3);

      await request(app.getHttpServer())
        .delete(`/statements/${statement.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Verify statement is deleted
      const statementRepo = dataSource.getRepository(Statement);
      const deletedStatement = await statementRepo.findOne({
        where: { id: statement.id },
      });
      expect(deletedStatement).toBeNull();

      // Verify expenses are also deleted (cascade)
      const expensesAfter = await expenseRepo.find({
        where: { statementId: statement.id },
      });
      expect(expensesAfter).toHaveLength(0);
    });

    it('should not delete another users statement', async () => {
      // Create another user and their statement
      const inviteCode = await inviteCodesService.generate();
      const otherUserResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'otheruser-delete@example.com',
          password: 'password123',
          name: 'Other User Delete',
          inviteCode: inviteCode.code,
        });

      const otherUserId = otherUserResponse.body.user.id;
      const statementRepo = dataSource.getRepository(Statement);
      const otherStatement = await statementRepo.save(
        statementRepo.create({
          userId: otherUserId,
          originalFilename: 'other.pdf',
          filePath: '/uploads/other/other.pdf',
          uploadDate: new Date(),
          status: StatementStatus.COMPLETED,
        }),
      );

      // Try to delete other user's statement
      await request(app.getHttpServer())
        .delete(`/statements/${otherStatement.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      // Verify statement still exists
      const existingStatement = await statementRepo.findOne({
        where: { id: otherStatement.id },
      });
      expect(existingStatement).not.toBeNull();
    });

    it('should return 404 for non-existent statement', async () => {
      await request(app.getHttpServer())
        .delete('/statements/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should reject request without authentication', async () => {
      const statement = await createStatement();

      await request(app.getHttpServer())
        .delete(`/statements/${statement.id}`)
        .expect(401);
    });
  });

  describe('POST /statements/upload-bulk', () => {
    it('should accept multiple PDF files and return statement IDs', async () => {
      // Use different content for each file to avoid duplicate detection
      const pdfContent1 = Buffer.from('%PDF-1.4 test content 1');
      const pdfContent2 = Buffer.from('%PDF-1.4 test content 2');
      const pdfContent3 = Buffer.from('%PDF-1.4 test content 3');

      const response = await request(app.getHttpServer())
        .post('/statements/upload-bulk')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('files', pdfContent1, {
          filename: 'statement1.pdf',
          contentType: 'application/pdf',
        })
        .attach('files', pdfContent2, {
          filename: 'statement2.pdf',
          contentType: 'application/pdf',
        })
        .attach('files', pdfContent3, {
          filename: 'statement3.pdf',
          contentType: 'application/pdf',
        })
        .expect(201);

      expect(response.body.statements).toHaveLength(3);
      expect(response.body.totalQueued).toBe(3);

      response.body.statements.forEach(
        (stmt: { id: string; originalFilename: string; status: string }) => {
          expect(stmt.id).toBeDefined();
          expect(stmt.originalFilename).toMatch(/statement\d\.pdf/);
          expect(stmt.status).toBe('pending');
        },
      );
    });

    it('should create statements in database', async () => {
      const pdfContent = Buffer.from('%PDF-1.4 test content');

      const response = await request(app.getHttpServer())
        .post('/statements/upload-bulk')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('files', pdfContent, {
          filename: 'test.pdf',
          contentType: 'application/pdf',
        })
        .expect(201);

      const statementId = response.body.statements[0].id;
      const statementRepo = dataSource.getRepository(Statement);
      const statement = await statementRepo.findOne({
        where: { id: statementId },
      });

      expect(statement).toBeDefined();
      // Status may be pending or processing depending on queue timing
      expect([StatementStatus.PENDING, StatementStatus.PROCESSING]).toContain(
        statement!.status,
      );
      expect(statement!.userId).toBe(userId);
    });

    it('should reject non-PDF files', async () => {
      const textContent = Buffer.from('This is not a PDF');

      await request(app.getHttpServer())
        .post('/statements/upload-bulk')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('files', textContent, 'document.txt')
        .expect(400);
    });

    it('should reject request without authentication', async () => {
      const pdfContent = Buffer.from('%PDF-1.4 test content');

      await request(app.getHttpServer())
        .post('/statements/upload-bulk')
        .attach('files', pdfContent, {
          filename: 'statement.pdf',
          contentType: 'application/pdf',
        })
        .expect(401);
    });
  });
});
