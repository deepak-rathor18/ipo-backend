process.env.NODE_ENV = 'test';
process.env.PORT = '5001';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.DEEPAK_AUTH_CODE = 'deepak-test-code-123';
process.env.AMAN_AUTH_CODE = 'aman-test-code-456';
process.env.JWT_SECRET = 'test-jwt-secret-please-ignore-1234567890';
process.env.JWT_EXPIRES_IN = '7d';
process.env.SESSION_SECRET = 'test-session-secret-please-ignore-1234567890';
process.env.COOKIE_NAME = 'fintrack_token';
process.env.RATE_LIMIT_WINDOW_MS = '900000';
process.env.RATE_LIMIT_MAX = '10000';
process.env.AUTH_RATE_LIMIT_MAX = '10000';
// MONGODB_URI is set per-test-file after mongodb-memory-server starts,
// via tests/testServer.ts, before any app module is imported.
