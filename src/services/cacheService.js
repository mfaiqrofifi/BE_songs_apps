import redis from 'redis';
import 'dotenv/config';

class CacheService {
  constructor() {
    // const url = process.env.REDIS_SERVER || 'redis://127.0.0.1:6379';
    this._client = redis.createClient({
      socket: {
        host: process.env.REDIS_HOST,
      },
    });
    this._client.on('error', (e) => console.error('Redis error:', e));
    this._client.connect();
    this._ttl = 1800;
  }

  async get(key) {
    return this._client.get(key);
  }

  async set(key, value, ttl = this._ttl) {
    await this._client.set(key, value, { EX: ttl });
  }

  async del(key) {
    await this._client.del(key);
  }
}
export default CacheService;
