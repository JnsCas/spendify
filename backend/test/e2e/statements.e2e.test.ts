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
      customName: 'Visa',
      lastFourDigits: '1234',
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

    it('should filter statements by date range using endYear and endMonth', async () => {
      // Create statements in different months
      await createStatement({ statementDate: new Date('2024-01-15') });
      await createStatement({ statementDate: new Date('2024-06-15') });
      await createStatement({ statementDate: new Date('2023-06-15') });

      // Request 12 months ending June 2024 (Jul 2023 - Jun 2024)
      const response = await request(app.getHttpServer())
        .get('/statements?endYear=2024&endMonth=6')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Should include Jan 2024 and Jun 2024 (both in range Jul 2023 - Jun 2024)
      // Should NOT include Jun 2023 (before range)
      expect(response.body).toHaveLength(2);
      response.body.forEach((statement: Statement) => {
        const date = new Date(statement.statementDate);
        // All should be within Jul 2023 - Jun 2024
        expect(date >= new Date('2023-07-01')).toBe(true);
        expect(date <= new Date('2024-06-30')).toBe(true);
      });
    });

    it('should filter statements by 12-month range', async () => {
      await createStatement({ statementDate: new Date('2024-01-15') });
      await createStatement({ statementDate: new Date('2024-01-20') });
      await createStatement({ statementDate: new Date('2024-02-15') });
      await createStatement({ statementDate: new Date('2023-01-15') });

      // Request 12 months ending Feb 2024 (Mar 2023 - Feb 2024)
      const response = await request(app.getHttpServer())
        .get('/statements?endYear=2024&endMonth=2')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Should include: Jan 2024 (x2), Feb 2024 (all in range)
      // Should NOT include: Jan 2023 (before Mar 2023)
      expect(response.body).toHaveLength(3);
    });

    it('should return empty array when no statements match date range', async () => {
      await createStatement({ statementDate: new Date('2024-01-15') });

      // Request 12 months ending Dec 2020 (Jan 2020 - Dec 2020)
      const response = await request(app.getHttpServer())
        .get('/statements?endYear=2020&endMonth=12')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveLength(0);
    });

    it('should reject request without authentication', async () => {
      await request(app.getHttpServer()).get('/statements').expect(401);
    });
  });

  describe('GET /statements/summary', () => {
    it('should return summary for specified date range', async () => {
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
        .get('/statements/summary?endYear=2024&endMonth=2')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('availableMonths');
      expect(response.body).toHaveProperty('rangeSummary');
      expect(response.body).toHaveProperty('cardBreakdown');
      expect(response.body.rangeSummary).toHaveProperty('startDate');
      expect(response.body.rangeSummary).toHaveProperty('endDate');
    });

    it('should return available months list', async () => {
      await createStatement({ statementDate: new Date('2024-02-15') });
      await createStatement({ statementDate: new Date('2024-01-15') });
      await createStatement({ statementDate: new Date('2023-06-15') });

      const response = await request(app.getHttpServer())
        .get('/statements/summary?endYear=2024&endMonth=12')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Available months should include all months with data
      expect(response.body.availableMonths).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ year: 2024, month: 2 }),
          expect.objectContaining({ year: 2024, month: 1 }),
          expect.objectContaining({ year: 2023, month: 6 }),
        ]),
      );
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

      // Request 12 months ending March 2024 (includes Jan and Mar 2024)
      const response = await request(app.getHttpServer())
        .get('/statements/summary?endYear=2024&endMonth=3')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const { monthlyData } = response.body.rangeSummary;

      // Find January data
      const januaryData = monthlyData.find(
        (m: { month: number; year: number }) => m.month === 1 && m.year === 2024,
      );
      expect(januaryData).toBeDefined();
      expect(januaryData.totalArs).toBe(15000);
      expect(januaryData.totalUsd).toBe(75);
      expect(januaryData.statementCount).toBe(2);

      // Find March data
      const marchData = monthlyData.find(
        (m: { month: number; year: number }) => m.month === 3 && m.year === 2024,
      );
      expect(marchData).toBeDefined();
      expect(marchData.totalArs).toBe(8000);
      expect(marchData.totalUsd).toBe(40);
      expect(marchData.statementCount).toBe(1);
    });

    it('should return card breakdown', async () => {
      const card1 = await createCard({
        customName: 'Visa',
        lastFourDigits: '1234',
      });
      const card2 = await createCard({
        customName: 'Mastercard',
        lastFourDigits: '5678',
      });

      const statement = await createStatement({
        statementDate: new Date('2024-01-15'),
      });

      await createExpense(statement.id, card1.id, {
        amountArs: 5000,
        amountUsd: 25,
        purchaseDate: new Date('2024-01-10'),
      });
      await createExpense(statement.id, card1.id, {
        amountArs: 3000,
        amountUsd: 15,
        purchaseDate: new Date('2024-01-12'),
      });
      await createExpense(statement.id, card2.id, {
        amountArs: 2000,
        amountUsd: 10,
        purchaseDate: new Date('2024-01-14'),
      });

      // Request 12 months ending Jan 2024 (includes Jan 2024)
      const response = await request(app.getHttpServer())
        .get('/statements/summary?endYear=2024&endMonth=1')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.cardBreakdown).toHaveLength(2);

      const visaBreakdown = response.body.cardBreakdown.find(
        (c: { customName: string }) => c.customName === 'Visa',
      );
      expect(visaBreakdown).toBeDefined();
      expect(parseFloat(visaBreakdown.totalArs)).toBe(8000);
      expect(parseFloat(visaBreakdown.totalUsd)).toBe(40);

      const mastercardBreakdown = response.body.cardBreakdown.find(
        (c: { customName: string }) => c.customName === 'Mastercard',
      );
      expect(mastercardBreakdown).toBeDefined();
      expect(parseFloat(mastercardBreakdown.totalArs)).toBe(2000);
      expect(parseFloat(mastercardBreakdown.totalUsd)).toBe(10);
    });

    it('should default to current month when not specified', async () => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      await createStatement({
        statementDate: new Date(`${currentYear}-${String(currentMonth).padStart(2, '0')}-15`),
      });

      const response = await request(app.getHttpServer())
        .get('/statements/summary')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // The end date should be the last day of current month
      const endDate = new Date(response.body.rangeSummary.endDate);
      expect(endDate.getFullYear()).toBe(currentYear);
      expect(endDate.getMonth() + 1).toBe(currentMonth);
    });

    it('should return empty data for date range with no statements', async () => {
      await createStatement({ statementDate: new Date('2024-01-15') });

      // Request 12 months ending Dec 2020 - no statements in this range
      const response = await request(app.getHttpServer())
        .get('/statements/summary?endYear=2020&endMonth=12')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.rangeSummary.monthlyData).toHaveLength(0);
      expect(response.body.rangeSummary.totalArs).toBe(0);
      expect(response.body.rangeSummary.totalUsd).toBe(0);
    });

    it('should reject request without authentication', async () => {
      await request(app.getHttpServer())
        .get('/statements/summary?endYear=2024&endMonth=1')
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
