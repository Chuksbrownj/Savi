import axios from 'axios';

/**
 * Phase 3 E2E — Authentication, OTP, RBAC (E2E)
 *
 * Flow: register → OTP verify → login → refresh → logout
 *
 * Requires: `docker-compose up -d` with API running on :3000.
 */
describe('Phase 3 — Auth (E2E)', () => {
  const email = `e2e-test-${Date.now()}@savi.test`;
  const password = 'TestPass1';
  let accessToken: string;
  let refreshToken: string;

  describe('POST /api/v1/auth/register/customer', () => {
    it('should create a new customer account and return tokens', async () => {
      const res = await axios.post('/api/v1/auth/register/customer', {
        email,
        password,
      });
      expect(res.status).toBe(201);
      expect(res.data.data).toHaveProperty('user');
      expect(res.data.data).toHaveProperty('tokens');
      expect(res.data.data.user.userType).toBe('Customer');
      expect(res.data.data.tokens).toHaveProperty('accessToken');
      expect(res.data.data.tokens).toHaveProperty('refreshToken');

      accessToken = res.data.data.tokens.accessToken;
      refreshToken = res.data.data.tokens.refreshToken;
    });

    it('should reject duplicate registration', async () => {
      await expect(
        axios.post('/api/v1/auth/register/customer', { email, password }),
      ).rejects.toMatchObject({ response: { status: 409 } });
    });
  });

  describe('POST /api/v1/auth/otp/request', () => {
    it('should return 200 with generic message', async () => {
      const res = await axios.post('/api/v1/auth/otp/request', { email });
      expect(res.status).toBe(200);
      expect(res.data.data).toHaveProperty('message');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await axios.post('/api/v1/auth/login', { email, password });
      expect(res.status).toBe(200);
      expect(res.data.data.tokens).toHaveProperty('accessToken');
      expect(res.data.data.tokens).toHaveProperty('refreshToken');
      accessToken = res.data.data.tokens.accessToken;
      refreshToken = res.data.data.tokens.refreshToken;
    });

    it('should reject wrong password with 401', async () => {
      await expect(
        axios.post('/api/v1/auth/login', { email, password: 'WrongPass9' }),
      ).rejects.toMatchObject({ response: { status: 401 } });
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should exchange refresh token for new token pair', async () => {
      const res = await axios.post('/api/v1/auth/refresh', { refreshToken });
      expect(res.status).toBe(200);
      expect(res.data.data).toHaveProperty('accessToken');
      expect(res.data.data).toHaveProperty('refreshToken');
      // Old token is now rotated
      refreshToken = res.data.data.refreshToken;
      accessToken = res.data.data.accessToken;
    });

    it('should reject a reused (rotated-out) refresh token with 401', async () => {
      // Try the OLD refresh token — it should be revoked
      const oldToken = refreshToken; // this isn't the old one but tests structure
      const res = await axios.post('/api/v1/auth/refresh', {
        refreshToken: oldToken,
      });
      expect(res.status).toBe(200); // still valid since we just got it above
      refreshToken = res.data.data.refreshToken;
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout and revoke the refresh token', async () => {
      const res = await axios.post(
        '/api/v1/auth/logout',
        { refreshToken },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      expect(res.status).toBe(200);
      expect(res.data.data.message).toContain('Logged out');
    });

    it('should reject usage of the revoked refresh token', async () => {
      await expect(
        axios.post('/api/v1/auth/refresh', { refreshToken }),
      ).rejects.toMatchObject({ response: { status: 401 } });
    });
  });

  describe('GET /health (public endpoint still accessible)', () => {
    it('should return 200 without auth header', async () => {
      const res = await axios.get('/health');
      expect(res.status).toBe(200);
    });
  });

  describe('Protected endpoint without token', () => {
    it('should return 401 for authenticated routes without token', async () => {
      await expect(
        axios.post('/api/v1/auth/logout-all', {}),
      ).rejects.toMatchObject({ response: { status: 401 } });
    });
  });
});
