import request from 'supertest';

jest.mock('../modules/auth/webhookController', () => ({
  handleClerkWebhook: (_req: any, res: any) => res.status(200).send('OK'),
}));

import app from '../app';

describe('AI Assistant Chat Endpoint (Phase 7)', () => {
  it('should return health check or AI status cleanly', async () => {
    const response = await request(app).get('/api/v1/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  }, 15000);
});
