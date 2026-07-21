import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // ramp up to 20 concurrent users
    { duration: '1m', target: 20 },  // stay at 20 users for 1 minute
    { duration: '30s', target: 0 },  // ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<300'], // 95% of requests should be below 300ms
  },
};

// Use environment variable for BASE_URL, default to localhost
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // 1. Check health endpoint
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health check status is 200': (r) => r.status === 200,
  });

  // 2. Simulate Login attempt (Auth bottleneck check)
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: 'test_load_user@example.com',
    password: 'Password123!'
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  check(loginRes, {
    'login responds (400/401/404)': (r) => [400, 401, 404].includes(r.status),
  });

  sleep(1); // Think time between iterations
}
