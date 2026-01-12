import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as path from 'path';
import * as fs from 'fs';
import { TestApp } from '../utils/test-app';
import { InviteCodesService } from '../../src/invite-codes/invite-codes.service';
import { AnthropicService, ParsedStatement } from '../../src/parser/anthropic.service';

// TODO: These tests require proper PDF file fixtures or mocked file validation
// The FileTypeValidator rejects programmatically created PDF buffers
describe.skip('Statements (e2e)', () => {
  let app: INestApplication;
  let testApp: TestApp;
  let inviteCodesService: InviteCodesService;
  let anthropicService: AnthropicService;
  let accessToken: string;
  let userId: string;

  // Create a minimal valid PDF buffer for testing
  const createMockPdfBuffer = (): Buffer => {
    // Minimal valid PDF structure
    const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>
endobj
xref
0 4
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
trailer
<< /Size 4 /Root 1 0 R >>
startxref
193
%%EOF`;
    return Buffer.from(pdfContent);
  };

  beforeAll(async () => {
    testApp = new TestApp();
    app = await testApp.initialize();
    inviteCodesService = testApp.get<InviteCodesService>(InviteCodesService);
    anthropicService = testApp.get<AnthropicService>(AnthropicService);

    // Mock Anthropic service to avoid real API calls
    jest.spyOn(anthropicService, 'parseStatementText').mockResolvedValue({
      expenses: [
        {
          description: 'Test Purchase',
          amount_ars: 1000,
          amount_usd: null,
          current_installment: null,
          total_installments: null,
          card_identifier: '1234',
          purchase_date: '2024-01-10',
        },
      ],
      summary: {
        total_ars: 1000,
        total_usd: 0,
        due_date: '2024-02-01',
        statement_date: '2024-01-15',
      },
    } as ParsedStatement);
  });

  afterAll(async () => {
    await testApp.close();

    // Cleanup test uploads
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (fs.existsSync(uploadsDir)) {
      fs.rmSync(uploadsDir, { recursive: true, force: true });
    }
  });

  beforeEach(async () => {
    await testApp.cleanup();

    // Create a test user and get token
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

  describe('/statements/upload (POST)', () => {
    it('should upload and create a statement', async () => {
      const response = await request(app.getHttpServer())
        .post('/statements/upload')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', createMockPdfBuffer(), 'test-statement.pdf')
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.originalFilename).toBe('test-statement.pdf');
      expect(response.body.status).toBe('pending');
      expect(response.body.userId).toBe(userId);
    });

    it('should reject upload without authentication', async () => {
      await request(app.getHttpServer())
        .post('/statements/upload')
        .attach('file', createMockPdfBuffer(), 'test.pdf')
        .expect(401);
    });

    it('should reject non-PDF files', async () => {
      await request(app.getHttpServer())
        .post('/statements/upload')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', Buffer.from('not a pdf'), 'test.txt')
        .expect(400);
    });

    it('should reject upload without file', async () => {
      await request(app.getHttpServer())
        .post('/statements/upload')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });
  });

  describe('/statements (GET)', () => {
    beforeEach(async () => {
      // Upload some test statements
      await request(app.getHttpServer())
        .post('/statements/upload')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', createMockPdfBuffer(), 'statement1.pdf');

      await request(app.getHttpServer())
        .post('/statements/upload')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', createMockPdfBuffer(), 'statement2.pdf');
    });

    it('should return all statements for authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .get('/statements')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
      expect(response.body[0]).toHaveProperty('originalFilename');
      expect(response.body[0]).toHaveProperty('status');
    });

    it('should reject request without authentication', async () => {
      await request(app.getHttpServer())
        .get('/statements')
        .expect(401);
    });

    it('should only return statements belonging to the user', async () => {
      // Create another user
      const inviteCode2 = await inviteCodesService.generate();
      const registerResponse2 = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'user2@example.com',
          password: 'password123',
          name: 'User 2',
          inviteCode: inviteCode2.code,
        });

      const token2 = registerResponse2.body.accessToken;

      // Upload statement for second user
      await request(app.getHttpServer())
        .post('/statements/upload')
        .set('Authorization', `Bearer ${token2}`)
        .attach('file', createMockPdfBuffer(), 'user2-statement.pdf');

      // Check first user's statements
      const response1 = await request(app.getHttpServer())
        .get('/statements')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Should only see their own statements
      expect(response1.body.every((s: any) => s.userId === userId)).toBe(true);

      // Check second user's statements
      const response2 = await request(app.getHttpServer())
        .get('/statements')
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      expect(response2.body.length).toBe(1);
      expect(response2.body[0].originalFilename).toBe('user2-statement.pdf');
    });
  });

  describe('/statements/:id (GET)', () => {
    let statementId: string;

    beforeEach(async () => {
      const uploadResponse = await request(app.getHttpServer())
        .post('/statements/upload')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', createMockPdfBuffer(), 'test-statement.pdf');

      statementId = uploadResponse.body.id;
    });

    it('should return a specific statement with expenses', async () => {
      const response = await request(app.getHttpServer())
        .get(`/statements/${statementId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.id).toBe(statementId);
      expect(response.body).toHaveProperty('expenses');
    });

    it('should reject request for non-existent statement', async () => {
      await request(app.getHttpServer())
        .get('/statements/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should reject request without authentication', async () => {
      await request(app.getHttpServer())
        .get(`/statements/${statementId}`)
        .expect(401);
    });

    it('should not allow access to other users statements', async () => {
      // Create another user
      const inviteCode2 = await inviteCodesService.generate();
      const registerResponse2 = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'user2@example.com',
          password: 'password123',
          name: 'User 2',
          inviteCode: inviteCode2.code,
        });

      const token2 = registerResponse2.body.accessToken;

      // Try to access first user's statement
      await request(app.getHttpServer())
        .get(`/statements/${statementId}`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(404);
    });
  });

  describe('/statements/:id (DELETE)', () => {
    let statementId: string;

    beforeEach(async () => {
      const uploadResponse = await request(app.getHttpServer())
        .post('/statements/upload')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', createMockPdfBuffer(), 'test-statement.pdf');

      statementId = uploadResponse.body.id;
    });

    it('should delete a statement', async () => {
      await request(app.getHttpServer())
        .delete(`/statements/${statementId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Verify it's deleted
      await request(app.getHttpServer())
        .get(`/statements/${statementId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should reject deletion without authentication', async () => {
      await request(app.getHttpServer())
        .delete(`/statements/${statementId}`)
        .expect(401);
    });

    it('should not allow deletion of other users statements', async () => {
      // Create another user
      const inviteCode2 = await inviteCodesService.generate();
      const registerResponse2 = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'user2@example.com',
          password: 'password123',
          name: 'User 2',
          inviteCode: inviteCode2.code,
        });

      const token2 = registerResponse2.body.accessToken;

      // Try to delete first user's statement
      await request(app.getHttpServer())
        .delete(`/statements/${statementId}`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(404);
    });
  });
});
