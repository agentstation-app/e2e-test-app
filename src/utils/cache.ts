import Redis from "ioredis";

interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  ttl: number;
}

export class CacheManager {
  private redis: Redis;
  private defaultTTL: number;

  constructor(config: CacheConfig) {
    this.redis = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
    });
    this.defaultTTL = config.ttl;
  }

  async get<T>(key: string): Promise<T | null> {
    const data = await this.redis.get(key);
    if (\!data) return null;
    return JSON.parse(data) as T;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    await this.redis.set(key, serialized, "EX", ttl ?? this.defaultTTL);
  }

  async invalidate(pattern: string): Promise<number> {
    const keys = await this.redis.keys(pattern);
    if (keys.length === 0) return 0;
    return this.redis.del(...keys);
  }

  async disconnect(): Promise<void> {
    await this.redis.quit();
  }
}
