import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { createHash } from 'crypto';
import { gzip, gunzip } from 'zlib';
import { promisify } from 'util';
import { CacheOptions, CacheStats, CacheResult, CacheKeyOptions } from './interfaces/cache.interface';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private redis: Redis;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    totalKeys: 0,
    memoryUsage: 0,
  };

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.initializeRedis();
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit();
    }
  }

  private async initializeRedis() {
    try {
      const redisConfig = {
        host: this.configService.get<string>('REDIS_HOST', 'localhost'),
        port: this.configService.get<number>('REDIS_PORT', 6379),
        password: this.configService.get<string>('REDIS_PASSWORD'),
        db: this.configService.get<number>('REDIS_DB', 0),
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      };

      this.redis = new Redis(redisConfig);

      this.redis.on('connect', () => {
        this.logger.log('Redis connected successfully');
      });

      this.redis.on('error', (error) => {
        this.logger.error('Redis connection error:', error);
      });

      this.redis.on('ready', () => {
        this.logger.log('Redis is ready to accept commands');
      });

      await this.redis.connect();
    } catch (error) {
      this.logger.error('Failed to initialize Redis:', error);
      throw error;
    }
  }

  /**
   * Generate a cache key using SHA-256 hashing
   */
  generateCacheKey(
    data: any,
    options: CacheKeyOptions = {},
  ): string {
    const { prefix = '', suffix = '', includeTimestamp = false } = options;
    
    let keyData = JSON.stringify(data);
    
    if (includeTimestamp) {
      keyData += Date.now().toString();
    }

    const hash = createHash('sha256').update(keyData).digest('hex');
    
    let cacheKey = hash;
    if (prefix) cacheKey = `${prefix}:${cacheKey}`;
    if (suffix) cacheKey = `${cacheKey}:${suffix}`;
    
    return cacheKey;
  }

  /**
   * Get data from cache
   */
  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    try {
      if (!options.useCache) {
        return null;
      }

      const { namespace = 'default' } = options;
      const fullKey = `${namespace}:${key}`;
      
      const cached = await this.redis.get(fullKey);
      
      if (cached === null) {
        this.stats.misses++;
        this.updateHitRate();
        return null;
      }

      this.stats.hits++;
      this.updateHitRate();

      let data = cached;
      
      // Handle compressed data
      if (options.compress && cached.startsWith('gzip:')) {
        const compressedData = Buffer.from(cached.slice(5), 'base64');
        const decompressed = await gunzipAsync(compressedData);
        data = decompressed.toString();
      }

      return JSON.parse(data);
    } catch (error) {
      this.logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set data in cache
   */
  async set<T>(
    key: string,
    value: T,
    options: CacheOptions = {},
  ): Promise<boolean> {
    try {
      if (!options.useCache) {
        return false;
      }

      const { 
        ttl = this.configService.get<number>('DEFAULT_CACHE_TTL', 3600),
        namespace = 'default',
        compress = false,
      } = options;

      const fullKey = `${namespace}:${key}`;
      let dataToStore = JSON.stringify(value);

      // Compress large data if requested
      if (compress && dataToStore.length > 1024) {
        const compressed = await gzipAsync(Buffer.from(dataToStore));
        dataToStore = `gzip:${compressed.toString('base64')}`;
      }

      await this.redis.setex(fullKey, ttl, dataToStore);
      
      // Update stats
      this.stats.totalKeys = await this.redis.dbsize();
      
      return true;
    } catch (error) {
      this.logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Execute a function with caching
   */
  async executeWithCache<T>(
    cacheKey: string,
    executor: () => Promise<T>,
    options: CacheOptions = {},
  ): Promise<CacheResult<T>> {
    const startTime = Date.now();
    
    // Try to get from cache first
    const cached = await this.get<T>(cacheKey, options);
    
    if (cached !== null) {
      return {
        data: cached,
        cached: true,
        executionTime: Date.now() - startTime,
        cacheKey,
      };
    }

    // Execute the function
    const data = await executor();
    
    // Cache the result
    await this.set(cacheKey, data, options);
    
    return {
      data,
      cached: false,
      executionTime: Date.now() - startTime,
      cacheKey,
    };
  }

  /**
   * Delete a cache key
   */
  async delete(key: string, namespace: string = 'default'): Promise<boolean> {
    try {
      const fullKey = `${namespace}:${key}`;
      const result = await this.redis.del(fullKey);
      return result > 0;
    } catch (error) {
      this.logger.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Clear cache by pattern
   */
  async clearByPattern(pattern: string, namespace: string = 'default'): Promise<number> {
    try {
      const fullPattern = `${namespace}:${pattern}`;
      const keys = await this.redis.keys(fullPattern);
      
      if (keys.length === 0) {
        return 0;
      }

      const result = await this.redis.del(...keys);
      this.stats.totalKeys = await this.redis.dbsize();
      
      return result;
    } catch (error) {
      this.logger.error(`Cache clear by pattern error for pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    try {
      const info = await this.redis.info('memory');
      const memoryMatch = info.match(/used_memory:(\d+)/);
      
      this.stats.memoryUsage = memoryMatch ? parseInt(memoryMatch[1]) : 0;
      this.stats.totalKeys = await this.redis.dbsize();
      
      return { ...this.stats };
    } catch (error) {
      this.logger.error('Error getting cache stats:', error);
      return { ...this.stats };
    }
  }

  /**
   * Check if Redis is connected
   */
  isConnected(): boolean {
    return this.redis && this.redis.status === 'ready';
  }

  /**
   * Get Redis client for advanced operations
   */
  getClient(): Redis {
    return this.redis;
  }

  private updateHitRate() {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }
}
