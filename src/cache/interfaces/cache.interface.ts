export interface CacheOptions {
  ttl?: number;
  useCache?: boolean;
  compress?: boolean;
  namespace?: string;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalKeys: number;
  memoryUsage: number;
}

export interface CacheResult<T> {
  data: T;
  cached: boolean;
  executionTime: number;
  cacheKey?: string;
}

export interface CacheKeyOptions {
  prefix?: string;
  suffix?: string;
  includeTimestamp?: boolean;
}
