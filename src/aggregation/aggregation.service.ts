import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Connection, Model } from 'mongoose';
import { DatabaseService } from '../database/database.service';
import { CacheService } from '../cache/cache.service';
import { QueryType } from '../database/interfaces/database.interface';
import {
  AggregationOptions,
  AggregationResult,
  AggregationPipeline,
  AggregationStats,
  CacheInvalidationRule,
  QueryPattern,
  AggregationMetrics
} from './interfaces/aggregation.interface';

@Injectable()
export class AggregationService implements OnModuleInit {
  private readonly logger = new Logger(AggregationService.name);
  private stats: AggregationStats = {
    totalQueries: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageExecutionTime: 0,
    replicaQueries: 0,
    primaryQueries: 0,
    slowQueries: 0,
    errorCount: 0,
  };
  private executionTimes: number[] = [];
  private cacheInvalidationRules: Map<string, CacheInvalidationRule[]> = new Map();
  private queryPatterns: Map<string, QueryPattern> = new Map();

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly cacheService: CacheService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async onModuleInit() {
    this.initializeQueryPatterns();
    this.setupCacheInvalidationRules();
  }

  /**
   * Execute aggregation pipeline with caching and read replica support
   */
  async executeAggregation<T>(
    model: Model<any>,
    pipeline: any[],
    options: AggregationOptions = {}
  ): Promise<AggregationResult<T>> {
    const startTime = Date.now();
    const collectionName = model.collection.name;
    
    try {
      // Generate cache key if not provided
      const cacheKey = options.cacheKey || this.generateCacheKey(collectionName, pipeline, options);
      
      // Check cache first if enabled
      if (options.useCache !== false) {
        const cachedResult = await this.getCachedResult<T>(cacheKey, options);
        if (cachedResult) {
          this.updateStats('cache_hit', Date.now() - startTime);
          return cachedResult;
        }
      }

      // Invalidate cache if requested
      if (options.invalidateCache) {
        await this.invalidateCache(cacheKey);
      }

      // Execute aggregation with read replica support
      const result = await this.executeWithConnection<T>(
        model,
        pipeline,
        options,
        collectionName
      );

      const executionTime = Date.now() - startTime;
      
      // Cache the result if enabled
      if (options.useCache !== false && result.data) {
        await this.cacheResult(cacheKey, result.data, options);
      }

      // Warm cache if requested
      if (options.warmCache) {
        this.warmRelatedCache(collectionName, pipeline, options);
      }

      const aggregationResult: AggregationResult<T> = {
        ...result,
        cached: false,
        executionTime,
        cacheKey,
      };

      this.updateStats('cache_miss', executionTime, result.connectionUsed);
      this.recordMetrics(collectionName, executionTime, result.data, false, result.fromReplica);

      return aggregationResult;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.updateStats('error', executionTime);
      this.logger.error(`Aggregation error for ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Execute aggregation with specific connection
   */
  private async executeWithConnection<T>(
    model: Model<any>,
    pipeline: any[],
    options: AggregationOptions,
    collectionName: string
  ): Promise<{ data: T; connectionUsed: string; fromReplica: boolean }> {
    const queryType = QueryType.AGGREGATION;
    
    return await this.databaseService.executeWithTiming(
      queryType,
      async (connection: Connection) => {
        // Get the model from the specific connection
        const connectedModel = connection.model(model.modelName, model.schema);
        
        // Build aggregation query
        let aggregation = connectedModel.aggregate(pipeline);
        
        // Apply query options
        if (options.maxTimeMS) {
          aggregation = aggregation.option({ maxTimeMS: options.maxTimeMS });
        }
        
        if (options.hint) {
          aggregation = aggregation.hint(options.hint);
        }

        if (options.allowPartialResults) {
          aggregation = aggregation.allowDiskUse(true);
        }

        const data = await aggregation.exec();
        const plan = this.databaseService.createExecutionPlan(queryType, options);
        
        return {
          data: data as T,
          connectionUsed: plan.connectionName,
          fromReplica: plan.connectionType === 'replica',
        };
      },
      options
    );
  }

  /**
   * Get cached result
   */
  private async getCachedResult<T>(
    cacheKey: string,
    options: AggregationOptions
  ): Promise<AggregationResult<T> | null> {
    try {
      const cached = await this.cacheService.get<T>(cacheKey, {
        useCache: true,
        compress: options.cacheOptions?.compress,
      });

      if (cached) {
        return {
          data: cached,
          cached: true,
          executionTime: 0,
          connectionUsed: 'cache',
          cacheKey,
          fromReplica: false,
        };
      }
    } catch (error) {
      this.logger.warn(`Cache get error for key ${cacheKey}:`, error);
    }

    return null;
  }

  /**
   * Cache aggregation result
   */
  private async cacheResult<T>(
    cacheKey: string,
    data: T,
    options: AggregationOptions
  ): Promise<void> {
    try {
      const ttl = options.cacheTTL || this.configService.get<number>('DEFAULT_CACHE_TTL', 3600);
      
      await this.cacheService.set(cacheKey, data, {
        ttl,
        useCache: true,
        compress: options.cacheOptions?.compress,
      });
    } catch (error) {
      this.logger.warn(`Cache set error for key ${cacheKey}:`, error);
    }
  }

  /**
   * Generate cache key for aggregation
   */
  private generateCacheKey(
    collection: string,
    pipeline: any[],
    options: AggregationOptions
  ): string {
    const keyData = {
      collection,
      pipeline,
      readPreference: options.readPreference,
      maxTimeMS: options.maxTimeMS,
    };

    return this.cacheService.generateCacheKey(keyData, {
      prefix: 'aggregation',
      suffix: collection,
    });
  }

  /**
   * Batch execute multiple aggregations
   */
  async executeBatch<T>(
    aggregations: AggregationPipeline[],
    options: AggregationOptions = {}
  ): Promise<AggregationResult<T>[]> {
    const promises = aggregations.map(async (agg) => {
      // This would need the actual model, which should be passed in the pipeline config
      // For now, we'll throw an error indicating this needs to be implemented
      throw new Error('Batch execution requires model instances - implement model resolution');
    });

    return Promise.all(promises);
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidateCache(pattern: string): Promise<void> {
    try {
      await this.cacheService.clearByPattern(pattern);
      this.logger.log(`Invalidated cache pattern: ${pattern}`);
    } catch (error) {
      this.logger.error(`Cache invalidation error for pattern ${pattern}:`, error);
    }
  }

  /**
   * Invalidate cache for collection
   */
  async invalidateCacheForCollection(collection: string): Promise<void> {
    const pattern = `aggregation:*:${collection}`;
    await this.invalidateCache(pattern);
    
    // Apply custom invalidation rules
    const rules = this.cacheInvalidationRules.get(collection) || [];
    for (const rule of rules) {
      if (rule.pattern) {
        await this.invalidateCache(rule.pattern);
      }
    }
  }

  /**
   * Warm cache for frequently used queries
   */
  private async warmRelatedCache(
    collection: string,
    pipeline: any[],
    options: AggregationOptions
  ): Promise<void> {
    // This is a placeholder for cache warming logic
    // In a real implementation, you would identify related queries and pre-execute them
    this.logger.debug(`Warming cache for collection: ${collection}`);
  }

  /**
   * Initialize common query patterns
   */
  private initializeQueryPatterns(): void {
    // User permissions lookup
    this.queryPatterns.set('user_permissions', {
      name: 'user_permissions',
      collection: 'users',
      pipeline: [
        { $lookup: { from: 'permissions', localField: 'permissions', foreignField: 'for', as: 'permissions_have' } }
      ],
      cacheStrategy: 'moderate',
      ttl: 1800, // 30 minutes
      useReplica: true,
      warmOnStartup: true,
    });

    // User projects lookup
    this.queryPatterns.set('user_projects', {
      name: 'user_projects',
      collection: 'users',
      pipeline: [
        { $lookup: { from: 'projects', localField: '_id', foreignField: 'employee', as: 'projects' } }
      ],
      cacheStrategy: 'moderate',
      ttl: 3600, // 1 hour
      useReplica: true,
    });

    // Contract employees lookup
    this.queryPatterns.set('contract_employees', {
      name: 'contract_employees',
      collection: 'contracts',
      pipeline: [
        { $lookup: { from: 'users', localField: 'employee', foreignField: '_id', as: 'employees' } }
      ],
      cacheStrategy: 'aggressive',
      ttl: 7200, // 2 hours
      useReplica: true,
    });

    // Project designs lookup
    this.queryPatterns.set('project_designs', {
      name: 'project_designs',
      collection: 'projects',
      pipeline: [
        { $lookup: { from: 'designs', localField: 'designs', foreignField: '_id', as: 'designs' } }
      ],
      cacheStrategy: 'conservative',
      ttl: 1800, // 30 minutes
      useReplica: true,
    });
  }

  /**
   * Setup cache invalidation rules
   */
  private setupCacheInvalidationRules(): void {
    // User-related invalidations
    this.cacheInvalidationRules.set('users', [
      {
        collections: ['users', 'permissions'],
        pattern: 'aggregation:*:users',
        ttl: 1800,
      },
    ]);

    // Contract-related invalidations
    this.cacheInvalidationRules.set('contracts', [
      {
        collections: ['contracts', 'users'],
        pattern: 'aggregation:*:contracts',
        ttl: 3600,
      },
    ]);

    // Project-related invalidations
    this.cacheInvalidationRules.set('projects', [
      {
        collections: ['projects', 'designs', 'steps', 'notes'],
        pattern: 'aggregation:*:projects',
        ttl: 1800,
      },
    ]);
  }

  /**
   * Update statistics
   */
  private updateStats(
    type: 'cache_hit' | 'cache_miss' | 'error',
    executionTime: number,
    connectionUsed?: string
  ): void {
    this.stats.totalQueries++;
    
    if (type === 'cache_hit') {
      this.stats.cacheHits++;
    } else if (type === 'cache_miss') {
      this.stats.cacheMisses++;
    } else if (type === 'error') {
      this.stats.errorCount++;
    }

    if (connectionUsed?.includes('replica')) {
      this.stats.replicaQueries++;
    } else if (connectionUsed === 'primary') {
      this.stats.primaryQueries++;
    }

    // Track slow queries (> 1 second)
    if (executionTime > 1000) {
      this.stats.slowQueries++;
    }

    // Update average execution time
    this.executionTimes.push(executionTime);
    if (this.executionTimes.length > 1000) {
      this.executionTimes = this.executionTimes.slice(-1000);
    }
    
    this.stats.averageExecutionTime = 
      this.executionTimes.reduce((sum, time) => sum + time, 0) / this.executionTimes.length;
  }

  /**
   * Record metrics for monitoring
   */
  private recordMetrics(
    collection: string,
    executionTime: number,
    data: any,
    cached: boolean,
    fromReplica?: boolean
  ): void {
    const metrics: AggregationMetrics = {
      collection,
      executionTime,
      resultSize: Array.isArray(data) ? data.length : 1,
      cached,
      connectionType: fromReplica ? 'replica' : 'primary',
      timestamp: new Date(),
    };

    // Emit metrics event for monitoring
    this.eventEmitter.emit('aggregation.metrics', metrics);
  }

  /**
   * Get aggregation statistics
   */
  getStats(): AggregationStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalQueries: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageExecutionTime: 0,
      replicaQueries: 0,
      primaryQueries: 0,
      slowQueries: 0,
      errorCount: 0,
    };
    this.executionTimes = [];
  }

  /**
   * Get query patterns
   */
  getQueryPatterns(): QueryPattern[] {
    return Array.from(this.queryPatterns.values());
  }

  /**
   * Add custom query pattern
   */
  addQueryPattern(pattern: QueryPattern): void {
    this.queryPatterns.set(pattern.name, pattern);
  }
}
