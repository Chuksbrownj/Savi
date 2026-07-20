import axios from 'axios';

/**
 * Phase 1 E2E smoke tests.
 * These tests verify the API boots correctly and all infrastructure endpoints
 * respond as expected.
 *
 * Requires: `docker-compose up -d` (postgres + redis) before running.
 */
describe('Phase 1 — Foundation & Architecture (E2E)', () => {
  describe('GET /api/v1/health', () => {
    it('should return 200 with status ok when all services are up', async () => {
      const res = await axios.get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('data');
      expect(res.data.data).toHaveProperty('status', 'ok');
    });
  });

  describe('GET /api/v1/health/metrics', () => {
    it('should return 200 with metrics stub response', async () => {
      const res = await axios.get('/api/v1/health/metrics');
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('data');
    });
  });

  describe('GET /api/docs', () => {
    it('should return 200 for Swagger UI', async () => {
      const res = await axios.get('/api/docs');
      expect(res.status).toBe(200);
    });
  });
});
