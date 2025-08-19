import { describe, it, expect } from 'vitest';
import app from '../index'; // Honoのappインスタンス

describe('GET /api/categories', () => {
  it('should return a 404 Not Found response for now', async () => {
    const response = await app.request('/api/categories');
    expect(response.status).toBe(404);
  });
});
