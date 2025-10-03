import { QueryOptions, QueryType } from '../../database/interfaces/database.interface';
import { CacheOptions } from '../../cache/interfaces/cache.interface';

export interface AggregationOptions extends QueryOptions {
  cacheOptions?: CacheOptions;
  cacheKey?: string;
  cacheTTL?: number;
  useCache?: boolean;
  warmCache?: boolean;
  invalidateCache?: boolean;
}

export interface AggregationResult<T> {
  data: T;
  cached: boolean;
  executionTime: number;
  connectionUsed: string;
  cacheKey?: string;
  fromReplica?: boolean;
}

export interface AggregationPipeline {
  pipeline: any[];
  collection: string;
  options?: AggregationOptions;
}

export interface AggregationStats {
  totalQueries: number;
  cacheHits: number;
  cacheMisses: number;
  averageExecutionTime: number;
  replicaQueries: number;
  primaryQueries: number;
  slowQueries: number;
  errorCount: number;
}

export interface CacheInvalidationRule {
  collections: string[];
  pattern?: string;
  ttl?: number;
  conditions?: (data: any) => boolean;
}

export interface QueryPattern {
  name: string;
  collection: string;
  pipeline: any[];
  cacheStrategy: 'aggressive' | 'moderate' | 'conservative' | 'none';
  ttl: number;
  useReplica: boolean;
  warmOnStartup?: boolean;
}

export interface AggregationMetrics {
  queryName?: string;
  collection: string;
  executionTime: number;
  resultSize: number;
  cached: boolean;
  connectionType: 'primary' | 'replica';
  timestamp: Date;
  error?: string;
}
