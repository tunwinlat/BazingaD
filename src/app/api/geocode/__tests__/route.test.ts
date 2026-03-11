import { describe, it, expect } from 'vitest';
import { GET } from '../route';

describe('Geocode API', () => {
  it('should return 400 when query is empty', async () => {
    const request = new Request('http://localhost:3000/api/geocode?q=');
    const response = await GET(request);
    expect(response.status).toBe(400);
  });

  it('should return 400 when query is too short after sanitization', async () => {
    // Only contains special chars that get stripped
    const request = new Request('http://localhost:3000/api/geocode?q=!!!');
    const response = await GET(request);
    expect(response.status).toBe(400);
  });
});
