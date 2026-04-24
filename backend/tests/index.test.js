const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index'); // Adjust path to the app instance
const { URL } = require('../model/url.model');

describe('URL Shortener API', () => {
  beforeAll(async () => {
    // Replace DB URI if needed, test database
    const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/short-url-test";
    await mongoose.connect(MONGO_URI);
  });

  afterAll(async () => {
    await URL.deleteMany({});
    await mongoose.connection.close();
  });

  let originalShortId;

  it('should create a short URL', async () => {
    const res = await request(app)
      .post('/url')
      .send({ url: 'https://jestjs.io' });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('shortId');
    expect(res.body).toHaveProperty('shortUrl');
    originalShortId = res.body.shortId;
  });

  it('should return 400 for invalid URL', async () => {
    const res = await request(app)
      .post('/url')
      .send({ url: 'not-a-valid-url' });
    
    expect(res.statusCode).toEqual(400);
  });

  it('should redirect to original URL', async () => {
    const res = await request(app).get(`/${originalShortId}`);
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('https://jestjs.io');
  });

  it('should get analytics data format', async () => {
    const res = await request(app).get(`/url/analytics/${originalShortId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('totalClicks');
    expect(res.body).toHaveProperty('visitHistory');
    expect(res.body.totalClicks).toBeGreaterThan(0);
  });
});
