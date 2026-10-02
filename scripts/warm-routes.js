const http = require('http');

const base = process.env.WEB_BASE_URL || 'http://127.0.0.1:3000';
const routes = [
  '/',
  '/signup',
  '/login',
  '/dashboard',
  '/loans',
  '/choose-loan',
  '/verify',
  '/kyc',
  '/bank-info',
  '/confirm-loan',
  '/loan-success',
  '/profile',
  '/admin',
  '/agent',
  '/api/auth/me',
  '/api/loans',
  '/api/admin/agents',
  '/api/admin/loans',
  '/api/admin/customers',
];

function request(route) {
  return new Promise((resolve) => {
    const url = new URL(route, base);
    const req = http.get(url, { timeout: 20000, headers: { Accept: route.startsWith('/api/') ? 'application/json' : 'text/html' } }, (res) => {
      res.resume();
      res.on('end', () => resolve({ route, status: res.statusCode, type: res.headers['content-type'] || '' }));
    });
    req.on('timeout', () => { req.destroy(new Error('timeout')); });
    req.on('error', (error) => resolve({ route, error: error.message }));
  });
}

(async () => {
  for (const route of routes) {
    const result = await request(route);
    console.log(JSON.stringify(result));
  }
})();
