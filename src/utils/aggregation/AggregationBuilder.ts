/**
 * AggregationBuilder - Optimized MongoDB Aggregation Pipeline Builder
 * 
 * Provides a chainable interface for building optimized MongoDB aggregation pipelines
 * with performance monitoring, caching, and best practices built-in.
 */

import { Model, Types, PipelineStage } from 'mongoose';

export interface AggregationOptions {
  allowDiskUse?: boolean;
  maxTimeMS?: number;
  hint?: string | object;
  collation?: object;
  comment?: string;
  explain?: boolean;
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  key?: string; // Custom cache key
  enabled?: boolean;
}

export interface PerformanceMetrics {
  executionTime: number;
  documentsExamined: number;
  documentsReturned: number;
  indexesUsed: string[];
  memoryUsage?: number;
}

export class AggregationBuilder {
  private pipeline: PipelineStage[] = [];
  private options: AggregationOptions = {};
  private cacheOptions: CacheOptions = { enabled: false };
  private performanceTracking = true;

  constructor() {}

  /**
   * Create a new AggregationBuilder instance
   */
  static create(): AggregationBuilder {
    return new AggregationBuilder();
  }

  /**
   * Clone the current builder to create a new instance
   */
  clone(): AggregationBuilder {
    const cloned = new AggregationBuilder();
    cloned.pipeline = [...this.pipeline];
    cloned.options = { ...this.options };
    cloned.cacheOptions = { ...this.cacheOptions };
    cloned.performanceTracking = this.performanceTracking;
    return cloned;
  }

  /**
   * Add a $match stage to filter documents
   */
  match(conditions: object): AggregationBuilder {
    this.pipeline.push({ $match: conditions });
    return this;
  }

  /**
   * Add a $lookup stage for joining collections
   */
  lookup(options: {
    from: string;
    localField?: string;
    foreignField?: string;
    as: string;
    let?: object;
    pipeline?: PipelineStage[];
  }): AggregationBuilder {
    const lookupStage: any = {
      from: options.from,
      as: options.as
    };

    if (options.pipeline) {
      // Use pipeline-based lookup for complex joins
      if (options.let) {
        lookupStage.let = options.let;
      }
      lookupStage.pipeline = options.pipeline;
    } else {
      // Use simple field-based lookup
      lookupStage.localField = options.localField;
      lookupStage.foreignField = options.foreignField;
    }

    this.pipeline.push({ $lookup: lookupStage });
    return this;
  }

  /**
   * Add a $group stage for aggregating data
   */
  group(groupSpec: object): AggregationBuilder {
    this.pipeline.push({ $group: groupSpec });
    return this;
  }

  /**
   * Add a $project stage to reshape documents
   */
  project(projection: object): AggregationBuilder {
    this.pipeline.push({ $project: projection });
    return this;
  }

  /**
   * Add a $sort stage to order documents
   */
  sort(sortSpec: object): AggregationBuilder {
    this.pipeline.push({ $sort: sortSpec });
    return this;
  }

  /**
   * Add a $limit stage to limit results
   */
  limit(count: number): AggregationBuilder {
    this.pipeline.push({ $limit: count });
    return this;
  }

  /**
   * Add a $skip stage to skip documents
   */
  skip(count: number): AggregationBuilder {
    this.pipeline.push({ $skip: count });
    return this;
  }

  /**
   * Add an $unwind stage to deconstruct arrays
   */
  unwind(path: string | object): AggregationBuilder {
    this.pipeline.push({ $unwind: path });
    return this;
  }

  /**
   * Add a $addFields stage to add computed fields
   */
  addFields(fields: object): AggregationBuilder {
    this.pipeline.push({ $addFields: fields });
    return this;
  }

  /**
   * Add a $facet stage for multi-faceted aggregation
   */
  facet(facets: object): AggregationBuilder {
    this.pipeline.push({ $facet: facets });
    return this;
  }

  /**
   * Set aggregation options for performance optimization
   */
  setOptions(options: AggregationOptions): AggregationBuilder {
    this.options = { ...this.options, ...options };
    return this;
  }

  /**
   * Enable caching with options
   */
  cache(options: CacheOptions = {}): AggregationBuilder {
    this.cacheOptions = {
      enabled: true,
      ttl: 5 * 60 * 1000, // 5 minutes default
      ...options
    };
    return this;
  }

  /**
   * Add index hint for query optimization
   */
  hint(indexHint: string | object): AggregationBuilder {
    this.options.hint = indexHint;
    return this;
  }

  /**
   * Set maximum execution time
   */
  maxTime(ms: number): AggregationBuilder {
    this.options.maxTimeMS = ms;
    return this;
  }

  /**
   * Allow disk use for large datasets
   */
  allowDiskUse(allow: boolean = true): AggregationBuilder {
    this.options.allowDiskUse = allow;
    return this;
  }

  /**
   * Add comment for query identification
   */
  comment(comment: string): AggregationBuilder {
    this.options.comment = comment;
    return this;
  }

  /**
   * Get the built pipeline
   */
  getPipeline(): PipelineStage[] {
    return [...this.pipeline];
  }

  /**
   * Get aggregation options
   */
  getOptions(): AggregationOptions {
    return { ...this.options };
  }

  /**
   * Execute the aggregation pipeline
   */
  async execute<T = any>(model: Model<any>): Promise<T[]> {
    const startTime = Date.now();
    
    try {
      // Build the aggregation query
      const aggregation = model.aggregate(this.pipeline);
      
      // Apply options
      if (this.options.allowDiskUse) {
        aggregation.allowDiskUse(this.options.allowDiskUse);
      }
      if (this.options.maxTimeMS) {
        aggregation.maxTimeMS(this.options.maxTimeMS);
      }
      if (this.options.hint) {
        aggregation.hint(this.options.hint);
      }
      if (this.options.collation) {
        aggregation.collation(this.options.collation);
      }
      if (this.options.comment) {
        aggregation.comment(this.options.comment);
      }

      // Execute the aggregation
      const result = await aggregation.exec();
      
      // Track performance if enabled
      if (this.performanceTracking) {
        const executionTime = Date.now() - startTime;
        this.logPerformance({
          executionTime,
          documentsExamined: 0, // Would need explain() to get this
          documentsReturned: result.length,
          indexesUsed: [], // Would need explain() to get this
          pipeline: this.pipeline,
          options: this.options
        });
      }

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error('Aggregation execution failed:', {
        error: error.message,
        executionTime,
        pipeline: this.pipeline,
        options: this.options
      });
      throw error;
    }
  }

  /**
   * Execute with explain to get performance details
   */
  async explain(model: Model<any>): Promise<any> {
    const aggregation = model.aggregate(this.pipeline);
    return await aggregation.explain('executionStats');
  }

  /**
   * Log performance metrics
   */
  private logPerformance(metrics: any): void {
    if (metrics.executionTime > 1000) { // Log slow queries (>1s)
      console.warn('Slow aggregation detected:', {
        executionTime: `${metrics.executionTime}ms`,
        documentsReturned: metrics.documentsReturned,
        pipeline: JSON.stringify(metrics.pipeline, null, 2),
        suggestion: 'Consider adding indexes or optimizing pipeline stages'
      });
    }
  }

  /**
   * Optimize pipeline order for better performance
   */
  optimize(): AggregationBuilder {
    // Move $match stages to the beginning
    const matchStages = this.pipeline.filter(stage => '$match' in stage);
    const otherStages = this.pipeline.filter(stage => !('$match' in stage));
    
    this.pipeline = [...matchStages, ...otherStages];
    return this;
  }

  /**
   * Validate pipeline for common issues
   */
  validate(): { isValid: boolean; warnings: string[] } {
    const warnings: string[] = [];
    
    // Check for $match after $lookup (performance issue)
    let foundLookup = false;
    for (const stage of this.pipeline) {
      if ('$lookup' in stage) {
        foundLookup = true;
      } else if ('$match' in stage && foundLookup) {
        warnings.push('$match stage found after $lookup - consider moving $match earlier for better performance');
      }
    }

    // Check for missing $limit on potentially large results
    const hasLimit = this.pipeline.some(stage => '$limit' in stage);
    const hasLookup = this.pipeline.some(stage => '$lookup' in stage);
    if (hasLookup && !hasLimit) {
      warnings.push('Consider adding $limit stage when using $lookup to prevent large result sets');
    }

    return {
      isValid: warnings.length === 0,
      warnings
    };
  }
}

