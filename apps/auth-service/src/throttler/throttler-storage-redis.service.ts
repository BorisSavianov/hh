// src/throttler/throttler-storage-redis.service.ts
import { Injectable } from '@nestjs/common';
import { ThrottlerStorageService } from '@nestjs/throttler';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class ThrottlerStorageRedisService implements ThrottlerStorageService {
  constructor(private readonly redisService: RedisService) {}

  async increment(
    key: string,
    ttl: number,
  ): Promise<{ totalHits: number; timeToExpire: number }> {
    const totalHits = await this.redisService.incr(key);

    if (totalHits === 1) {
      await this.redisService.expire(key, ttl);
    }

    const timeToExpire = await this.redisService.ttl(key);

    return { totalHits, timeToExpire };
  }
}
