import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TestApp } from '../utils/test-app';
import { InviteCodesService } from '../../src/invite-codes/invite-codes.service';

describe('Authentication (e2e)', () => {
  let app: INestApplication;
  let testApp: TestApp;
  let inviteCodesService: InviteCodesService;

  beforeAll(async () => {
    testApp = new TestApp();
    app = await testApp.initialize();
    inviteCodesService = testApp.get<InviteCodesService>(InviteCodesService);
  });

  afterAll(async () => {
    await testApp.close();
  });

  beforeEach(async () => {
    await testApp.cleanup();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user with valid invite code', async () => {
      // Create an invite code
      const inviteCode = await inviteCodesService.generate();

      const registerDto = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
        inviteCode: inviteCode.code,
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(registerDto.email);
      expect(response.body.user.name).toBe(registerDto.name);
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    it('should reject registration with invalid invite code', async () => {
      const registerDto = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
        inviteCode: 'INVALID_CODE',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);
    });

    it('should reject registration with already used invite code', async () => {
      // Create and use an invite code
      const inviteCode = await inviteCodesService.generate();

      const firstUser = {
        email: 'first@example.com',
        password: 'password123',
        name: 'First User',
        inviteCode: inviteCode.code,
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(firstUser)
        .expect(201);

      // Try to use the same code again
      const secondUser = {
        email: 'second@example.com',
        password: 'password123',
        name: 'Second User',
        inviteCode: inviteCode.code,
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(secondUser)
        .expect(409); // Conflict
    });

    it('should reject registration with duplicate email', async () => {
      const inviteCode1 = await inviteCodesService.generate();
      const inviteCode2 = await inviteCodesService.generate();

      const registerDto = {
        email: 'duplicate@example.com',
        password: 'password123',
        name: 'User',
        inviteCode: inviteCode1.code,
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      // Try to register with same email
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...registerDto, inviteCode: inviteCode2.code })
        .expect(409);
    });

    it('should validate email format', async () => {
      const inviteCode = await inviteCodesService.generate();

      const registerDto = {
        email: 'invalid-email',
        password: 'password123',
        name: 'User',
        inviteCode: inviteCode.code,
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);
    });

    it('should validate password requirements', async () => {
      const inviteCode = await inviteCodesService.generate();

      const registerDto = {
        email: 'user@example.com',
        password: 'short',
        name: 'User',
        inviteCode: inviteCode.code,
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    beforeEach(async () => {
      // Create a test user
      const inviteCode = await inviteCodesService.generate();

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'testuser@example.com',
          password: 'password123',
          name: 'Test User',
          inviteCode: inviteCode.code,
        });
    });

    it('should login with valid credentials', async () => {
      const loginDto = {
        email: 'testuser@example.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(loginDto.email);
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    it('should reject login with invalid email', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);
    });

    it('should reject login with invalid password', async () => {
      const loginDto = {
        email: 'testuser@example.com',
        password: 'wrongpassword',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);
    });
  });

  describe('/auth/me (GET)', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Create and login a test user
      const inviteCode = await inviteCodesService.generate();

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'testuser@example.com',
          password: 'password123',
          name: 'Test User',
          inviteCode: inviteCode.code,
        });

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'password123',
        });

      accessToken = loginResponse.body.accessToken;
    });

    it('should return current user info with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('isAdmin');
      expect(response.body.user.email).toBe('testuser@example.com');
      expect(response.body.isAdmin).toBe(false);
    });

    it('should reject request without token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });

    it('should reject request with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);
    });

    it('should return admin status for admin user', async () => {
      // Create admin user
      const inviteCode = await inviteCodesService.generate();

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'admin@test.com',
          password: 'password123',
          name: 'Admin User',
          inviteCode: inviteCode.code,
        });

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'password123',
        });

      const adminToken = loginResponse.body.accessToken;

      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.isAdmin).toBe(true);
    });
  });
});
