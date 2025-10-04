import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Earning, ProjectEarning, OrgzEarning } from './interface/earning';
import { AggregationService } from '../aggregation/aggregation.service';
import { CacheService } from '../cache/cache.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AggregationOptions } from '../aggregation/interfaces/aggregation.interface';

@Injectable()
export class OptimizedEarningsService {
  private readonly logger = new Logger(OptimizedEarningsService.name);

  constructor(
    @InjectModel('ProjectEarning') private readonly pearnModel: Model<ProjectEarning>,
    @InjectModel('OrgzEarning') private readonly orgsearnModel: Model<OrgzEarning>,
    private readonly aggregationService: AggregationService,
    private readonly cacheService: CacheService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Get model by type
   */
  private getModel(type: string): Model<any> {
    if (type === "project") return this.pearnModel;
    if (type === "orgz") return this.orgsearnModel;
    throw new Error(`Invalid earning type: ${type}`);
  }

  /**
   * Get compound earnings with advanced caching and optimization
   */
  async getCompoundEarningsOptimized(
    type: string,
    id: string,
    options: AggregationOptions = {}
  ): Promise<any> {
    const model = this.getModel(type);
    
    const pipeline = [
      { $match: { _id: new Types.ObjectId(id) } },
      {
        $lookup: {
          from: type === 'project' ? 'projectearnings' : 'orgzearnings',
          let: { earningIds: '$earningIds' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ['$_id', '$$earningIds.id']
                }
              }
            },
            {
              $group: {
                _id: '$type',
                totalAmount: { $sum: '$amount' },
                currency: { $first: '$currency' },
                totalPeriod: { $sum: '$period' },
                count: { $sum: 1 },
                avgAmount: { $avg: '$amount' }
              }
            },
            {
              $project: {
                type: '$_id',
                totalAmount: 1,
                currency: 1,
                totalPeriod: 1,
                count: 1,
                avgAmount: 1,
                title: {
                  $concat: [
                    'Total earnings for ',
                    { $toString: '$totalPeriod' },
                    ' months: ',
                    { $toString: '$totalAmount' },
                    ' ',
                    '$currency'
                  ]
                }
              }
            }
          ],
          as: 'compoundEarnings'
        }
      },
      {
        $project: {
          _id: 1,
          earningIds: 1,
          compoundEarnings: 1,
          totalEarnings: {
            $sum: '$compoundEarnings.totalAmount'
          },
          totalPeriods: {
            $sum: '$compoundEarnings.totalPeriod'
          },
          earningTypes: {
            $size: '$compoundEarnings'
          }
        }
      }
    ];

    const cacheKey = this.cacheService.generateCacheKey(
      { type, id, operation: 'compound_earnings' },
      { prefix: 'earnings', suffix: 'compound' }
    );

    const aggregationOptions: AggregationOptions = {
      useReplica: true,
      useCache: true,
      cacheTTL: 1800, // 30 minutes
      cacheKey,
      readPreference: 'secondaryPreferred',
      ...options,
    };

    try {
      const result = await this.aggregationService.executeAggregation<any[]>(
        model,
        pipeline,
        aggregationOptions
      );

      const compoundEarnings = result.data?.[0] || null;
      
      // Emit event for analytics
      this.eventEmitter.emit('earnings.compound.accessed', {
        type,
        id,
        totalEarnings: compoundEarnings?.totalEarnings || 0,
        earningTypes: compoundEarnings?.earningTypes || 0,
        cached: result.cached,
        executionTime: result.executionTime,
      });

      return compoundEarnings;
    } catch (error) {
      this.logger.error(`Error getting compound earnings for ${type} ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get earnings statistics by type with caching
   */
  async getEarningsStatsOptimized(
    type: string,
    options: AggregationOptions = {}
  ): Promise<any> {
    const model = this.getModel(type);
    
    const pipeline = [
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$amount' },
          avgEarnings: { $avg: '$amount' },
          maxEarnings: { $max: '$amount' },
          minEarnings: { $min: '$amount' },
          totalRecords: { $sum: 1 },
          totalPeriods: { $sum: '$period' },
          currencies: { $addToSet: '$currency' }
        }
      },
      {
        $project: {
          _id: 0,
          totalEarnings: 1,
          avgEarnings: { $round: ['$avgEarnings', 2] },
          maxEarnings: 1,
          minEarnings: 1,
          totalRecords: 1,
          totalPeriods: 1,
          currencies: 1,
          avgPerPeriod: {
            $round: [
              { $divide: ['$totalEarnings', '$totalPeriods'] },
              2
            ]
          }
        }
      }
    ];

    const cacheKey = this.cacheService.generateCacheKey(
      { type, operation: 'stats' },
      { prefix: 'earnings', suffix: 'stats' }
    );

    const aggregationOptions: AggregationOptions = {
      useReplica: true,
      useCache: true,
      cacheTTL: 900, // 15 minutes
      cacheKey,
      readPreference: 'secondaryPreferred',
      ...options,
    };

    try {
      const result = await this.aggregationService.executeAggregation<any[]>(
        model,
        pipeline,
        aggregationOptions
      );

      const stats = result.data?.[0] || {
        totalEarnings: 0,
        avgEarnings: 0,
        maxEarnings: 0,
        minEarnings: 0,
        totalRecords: 0,
        totalPeriods: 0,
        currencies: [],
        avgPerPeriod: 0,
      };

      // Emit event for analytics
      this.eventEmitter.emit('earnings.stats.accessed', {
        type,
        stats,
        cached: result.cached,
        executionTime: result.executionTime,
      });

      return stats;
    } catch (error) {
      this.logger.error(`Error getting earnings stats for ${type}:`, error);
      throw error;
    }
  }

  /**
   * Get earnings by date range with caching
   */
  async getEarningsByDateRangeOptimized(
    type: string,
    startDate: Date,
    endDate: Date,
    options: AggregationOptions = {}
  ): Promise<any[]> {
    const model = this.getModel(type);
    
    const pipeline = [
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          dailyTotal: { $sum: '$amount' },
          count: { $sum: 1 },
          avgDaily: { $avg: '$amount' },
          currency: { $first: '$currency' }
        }
      },
      {
        $project: {
          date: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day'
            }
          },
          dailyTotal: 1,
          count: 1,
          avgDaily: { $round: ['$avgDaily', 2] },
          currency: 1
        }
      },
      {
        $sort: { date: 1 }
      }
    ];

    const cacheKey = this.cacheService.generateCacheKey(
      { type, startDate: startDate.toISOString(), endDate: endDate.toISOString(), operation: 'by_date_range' },
      { prefix: 'earnings', suffix: 'daterange' }
    );

    const aggregationOptions: AggregationOptions = {
      useReplica: true,
      useCache: true,
      cacheTTL: 3600, // 1 hour
      cacheKey,
      readPreference: 'secondaryPreferred',
      ...options,
    };

    try {
      const result = await this.aggregationService.executeAggregation<any[]>(
        model,
        pipeline,
        aggregationOptions
      );

      // Emit event for analytics
      this.eventEmitter.emit('earnings.by_date_range.accessed', {
        type,
        startDate,
        endDate,
        recordCount: result.data?.length || 0,
        cached: result.cached,
        executionTime: result.executionTime,
      });

      return result.data || [];
    } catch (error) {
      this.logger.error(`Error getting earnings by date range for ${type}:`, error);
      throw error;
    }
  }

  /**
   * Get top earning projects/organizations with caching
   */
  async getTopEarnersOptimized(
    type: string,
    limit: number = 10,
    options: AggregationOptions = {}
  ): Promise<any[]> {
    const model = this.getModel(type);
    const lookupCollection = type === 'project' ? 'projects' : 'orgzs';
    const lookupField = type === 'project' ? 'project' : 'orgz';
    
    const pipeline = [
      {
        $group: {
          _id: `$${lookupField}`,
          totalEarnings: { $sum: '$amount' },
          earningsCount: { $sum: 1 },
          avgEarnings: { $avg: '$amount' },
          maxEarning: { $max: '$amount' },
          totalPeriods: { $sum: '$period' },
          currency: { $first: '$currency' }
        }
      },
      {
        $lookup: {
          from: lookupCollection,
          localField: '_id',
          foreignField: '_id',
          as: 'details'
        }
      },
      {
        $addFields: {
          details: { $arrayElemAt: ['$details', 0] }
        }
      },
      {
        $project: {
          _id: 1,
          totalEarnings: 1,
          earningsCount: 1,
          avgEarnings: { $round: ['$avgEarnings', 2] },
          maxEarning: 1,
          totalPeriods: 1,
          currency: 1,
          name: '$details.name',
          title: '$details.title',
          description: '$details.description',
          earningsPerPeriod: {
            $round: [
              { $divide: ['$totalEarnings', '$totalPeriods'] },
              2
            ]
          }
        }
      },
      {
        $sort: { totalEarnings: -1 }
      },
      {
        $limit: limit
      }
    ];

    const cacheKey = this.cacheService.generateCacheKey(
      { type, limit, operation: 'top_earners' },
      { prefix: 'earnings', suffix: 'top' }
    );

    const aggregationOptions: AggregationOptions = {
      useReplica: true,
      useCache: true,
      cacheTTL: 1800, // 30 minutes
      cacheKey,
      readPreference: 'secondaryPreferred',
      ...options,
    };

    try {
      const result = await this.aggregationService.executeAggregation<any[]>(
        model,
        pipeline,
        aggregationOptions
      );

      // Emit event for analytics
      this.eventEmitter.emit('earnings.top_earners.accessed', {
        type,
        limit,
        resultCount: result.data?.length || 0,
        cached: result.cached,
        executionTime: result.executionTime,
      });

      return result.data || [];
    } catch (error) {
      this.logger.error(`Error getting top earners for ${type}:`, error);
      throw error;
    }
  }

  /**
   * Get earnings trend analysis with caching
   */
  async getEarningsTrendOptimized(
    type: string,
    months: number = 12,
    options: AggregationOptions = {}
  ): Promise<any[]> {
    const model = this.getModel(type);
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    
    const pipeline = [
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          monthlyTotal: { $sum: '$amount' },
          count: { $sum: 1 },
          avgMonthly: { $avg: '$amount' },
          maxMonthly: { $max: '$amount' },
          minMonthly: { $min: '$amount' }
        }
      },
      {
        $project: {
          date: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: 1
            }
          },
          monthlyTotal: 1,
          count: 1,
          avgMonthly: { $round: ['$avgMonthly', 2] },
          maxMonthly: 1,
          minMonthly: 1,
          monthName: {
            $dateToString: {
              format: '%B %Y',
              date: {
                $dateFromParts: {
                  year: '$_id.year',
                  month: '$_id.month',
                  day: 1
                }
              }
            }
          }
        }
      },
      {
        $sort: { date: 1 }
      }
    ];

    const cacheKey = this.cacheService.generateCacheKey(
      { type, months, operation: 'trend' },
      { prefix: 'earnings', suffix: 'trend' }
    );

    const aggregationOptions: AggregationOptions = {
      useReplica: true,
      useCache: true,
      cacheTTL: 1800, // 30 minutes
      cacheKey,
      readPreference: 'secondaryPreferred',
      ...options,
    };

    try {
      const result = await this.aggregationService.executeAggregation<any[]>(
        model,
        pipeline,
        aggregationOptions
      );

      // Calculate growth rates
      const trendData = result.data || [];
      for (let i = 1; i < trendData.length; i++) {
        const current = trendData[i].monthlyTotal;
        const previous = trendData[i - 1].monthlyTotal;
        trendData[i].growthRate = previous > 0 
          ? Math.round(((current - previous) / previous) * 100 * 100) / 100
          : 0;
      }

      // Emit event for analytics
      this.eventEmitter.emit('earnings.trend.accessed', {
        type,
        months,
        dataPoints: trendData.length,
        cached: result.cached,
        executionTime: result.executionTime,
      });

      return trendData;
    } catch (error) {
      this.logger.error(`Error getting earnings trend for ${type}:`, error);
      throw error;
    }
  }

  /**
   * Get earnings by currency with caching
   */
  async getEarningsByCurrencyOptimized(
    type: string,
    options: AggregationOptions = {}
  ): Promise<any[]> {
    const model = this.getModel(type);
    
    const pipeline = [
      {
        $group: {
          _id: '$currency',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' },
          maxAmount: { $max: '$amount' },
          minAmount: { $min: '$amount' }
        }
      },
      {
        $project: {
          currency: '$_id',
          totalAmount: 1,
          count: 1,
          avgAmount: { $round: ['$avgAmount', 2] },
          maxAmount: 1,
          minAmount: 1,
          percentage: 1 // Will be calculated after getting total
        }
      },
      {
        $sort: { totalAmount: -1 }
      }
    ];

    const cacheKey = this.cacheService.generateCacheKey(
      { type, operation: 'by_currency' },
      { prefix: 'earnings', suffix: 'currency' }
    );

    const aggregationOptions: AggregationOptions = {
      useReplica: true,
      useCache: true,
      cacheTTL: 1800, // 30 minutes
      cacheKey,
      readPreference: 'secondaryPreferred',
      ...options,
    };

    try {
      const result = await this.aggregationService.executeAggregation<any[]>(
        model,
        pipeline,
        aggregationOptions
      );

      const currencyData = result.data || [];
      
      // Calculate percentages
      const totalAmount = currencyData.reduce((sum, item) => sum + item.totalAmount, 0);
      currencyData.forEach(item => {
        item.percentage = totalAmount > 0 
          ? Math.round((item.totalAmount / totalAmount) * 100 * 100) / 100
          : 0;
      });

      // Emit event for analytics
      this.eventEmitter.emit('earnings.by_currency.accessed', {
        type,
        currencyCount: currencyData.length,
        totalAmount,
        cached: result.cached,
        executionTime: result.executionTime,
      });

      return currencyData;
    } catch (error) {
      this.logger.error(`Error getting earnings by currency for ${type}:`, error);
      throw error;
    }
  }

  /**
   * Invalidate earnings-related cache
   */
  async invalidateEarningsCache(type?: string, id?: string): Promise<void> {
    try {
      if (type && id) {
        // Invalidate specific earnings caches
        const patterns = [
          `earnings:*:${type}:${id}:*`,
          `earnings:*:${type}:*:compound`,
          `earnings:*:${type}:*:stats`,
        ];

        for (const pattern of patterns) {
          await this.cacheService.clearByPattern(pattern);
        }
      } else if (type) {
        // Invalidate all caches for a type
        await this.cacheService.clearByPattern(`earnings:*:${type}:*`);
      } else {
        // Invalidate all earnings caches
        await this.cacheService.clearByPattern('earnings:*');
      }

      this.logger.log(`Invalidated earnings cache${type ? ` for ${type}` : ''}${id ? ` ${id}` : ''}`);
    } catch (error) {
      this.logger.error('Error invalidating earnings cache:', error);
    }
  }

  /**
   * Warm frequently accessed earnings caches
   */
  async warmEarningsCaches(): Promise<void> {
    try {
      this.logger.log('Warming earnings caches...');

      const types = ['project', 'orgz'];
      
      for (const type of types) {
        // Warm stats cache
        await this.getEarningsStatsOptimized(type, { warmCache: true });
        
        // Warm top earners cache
        await this.getTopEarnersOptimized(type, 10, { warmCache: true });
        
        // Warm trend cache
        await this.getEarningsTrendOptimized(type, 12, { warmCache: true });
        
        // Warm currency breakdown cache
        await this.getEarningsByCurrencyOptimized(type, { warmCache: true });
      }

      this.logger.log('Earnings caches warmed successfully');
    } catch (error) {
      this.logger.error('Error warming earnings caches:', error);
    }
  }

  /**
   * Get performance metrics for earnings operations
   */
  getPerformanceMetrics(): any {
    return this.aggregationService.getStats();
  }
}
