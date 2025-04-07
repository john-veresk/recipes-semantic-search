import express from 'express';
import request from 'supertest';
import healthRouter from '../../routes/health';

describe('Health Endpoint', () => {
  const app = express();
  app.use(express.json());
  app.use('/health', healthRouter);

  it('should return 200 OK with status and timestamp', async () => {
    const response = await request(app).get('/health');
    
    // Check status code
    expect(response.status).toBe(200);
    
    // Check response body structure
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
    
    // Verify timestamp is a valid date
    const timestamp = new Date(response.body.timestamp);
    expect(timestamp.toString()).not.toBe('Invalid Date');
  });
}); 