/**
 * k6 stress test — Auth endpoints (register / login / get-me / logout)
 *
 * Run locally:  k6 run tests/stress/auth-load.js
 * Stages:
 *   0 → 20 users over 30 s   (warm-up)
 *   20 users held for 1 min  (steady state)
 *   20 → 50 users over 30 s  (spike)
 *   50 → 0 users over 30 s   (cool-down)
 *
 * Pass criteria (thresholds):
 *   95th-percentile response < 800 ms
 *   Error rate < 1 %
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate   = new Rate('errors');
const loginTrend  = new Trend('login_duration');

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m',  target: 20 },
    { duration: '30s', target: 50 },
    { duration: '30s', target: 0  },
  ],
  thresholds: {
    http_req_duration: ['p(95)<800'],
    http_req_failed:   ['rate<0.01'],
    errors:            ['rate<0.01'],
  },
};

const BASE = __ENV.BASE_URL || 'http://localhost:3001';

export default function () {
  const id    = `${__VU}_${__ITER}`;
  const email = `stress_${id}@lazycv.test`;
  const pass  = 'Stress1234!';

  // 1 — Register (may return 400 if already exists on repeat runs — ignore)
  http.post(`${BASE}/api/auth/register`,
    JSON.stringify({ username: `stress_${id}`, email, password: pass }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  // 2 — Login
  const loginStart = Date.now();
  const login = http.post(`${BASE}/api/auth/login`,
    JSON.stringify({ email, password: pass }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  loginTrend.add(Date.now() - loginStart);

  const loginOk = check(login, {
    'login → 200':      (r) => r.status === 200,
    'login → has user': (r) => {
      try { return JSON.parse(r.body).user !== undefined; } catch { return false; }
    },
  });
  errorRate.add(!loginOk);

  if (!loginOk) { sleep(1); return; }

  // Extract cookie manually (k6 doesn't auto-send cookies across requests)
  const tokenMatch = login.headers['Set-Cookie']
    ? login.headers['Set-Cookie'].match(/token=([^;]+)/) : null;
  const cookie = tokenMatch ? `token=${tokenMatch[1]}` : '';

  // 3 — get-me
  const me = http.get(`${BASE}/api/auth/get-me`, {
    headers: { Cookie: cookie },
  });
  const meOk = check(me, { 'get-me → 200': (r) => r.status === 200 });
  errorRate.add(!meOk);

  // 4 — Reports list (read path)
  const list = http.get(`${BASE}/api/interview`, {
    headers: { Cookie: cookie },
  });
  const listOk = check(list, { 'reports → 200': (r) => r.status === 200 });
  errorRate.add(!listOk);

  // 5 — Logout
  const logout = http.get(`${BASE}/api/auth/logout`, {
    headers: { Cookie: cookie },
  });
  check(logout, { 'logout → 200': (r) => r.status === 200 });

  sleep(1);
}
