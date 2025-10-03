import { Injectable, Logger } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { AddEarningDto } from './dto/add-earning.dto';
import { CompoundEarningDto } from './dto/compound-earning.dto';
import { Earning, ProjectEarning, OrgzEarning } from './interface/earning';
import { ProjectService } from "../projects/";
import { OrgzService } from "../orgs/orgzs.service";
import { AggregationService, AggregationOptions } from '../aggregation/aggregation.service';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class OptimizedEarningService {
  private readonly logger = new Logger(OptimizedEarningService.name);

  constructor(
    @InjectModel('ProjectEarning') private readonly pearnModel: Model<ProjectEarning>,
    @InjectModel('OrgzEarning') private readonly orgsearnModel: Model<OrgzEarning>,
    private readonly aggregationService: AggregationService,
    private readonly cacheService: CacheService,
    private projectService: ProjectService,
    private orgzService: OrgzService,
  ) {}

  /**
   * Get model by type
   */
  model(type: string): any {
    if (type === "project") return this.pearnModel;
    if (type === "orgz") return this.orgsearnModel;
    throw new Error(`Unknown earning type: ${type}`);
  }

  /**
   * Add earning with cache invalidation
   */
  async add(addEarningDto: AddEarningDto): Promise<Earning> {
    const { forType, addToId, ...rest } = addEarningDto;
    
    let result: Earning;
    
    if (forType === "project") {
      const createdNote = new this.pearnModel({ ...rest });
      createdNote.project = await this.projectService.find_Id(addToId);
      result = await createdNote.save();
    } else if (forType === "orgz") {
      const createdOrgEarn = new this.orgsearnModel({ ...rest });
      createdOrgEarn.orgz = await this.orgzService.find_Id(addToId);
      result = await createdOrgEarn.save();
    } else {
      throw new Error(`Invalid earning type: ${forType}`);
    }

    // Invalidate related caches
    await this.invalidateRelatedCaches(forType, addToId);
    
    return result;
  }

  /**
   * Collect organization earnings with optimization
   */
  async collect_orgz_earn(opts: {
    orgzid: string;
    type: string;
    id: string | Types.ObjectId;
  }): Promise<any> {
    const model = this.orgsearnModel;
    const result = await model.findByIdAndUpdate(
      opts.orgzid,
      {
        $push: { earningIds: { type: opts.type, id: opts.id } }
      },
      { new: true }
    ).exec();

    // Invalidate related caches
    await this.invalidateRelatedCaches('orgz', opts.orgzid);
    
    return result;
  }

  /**
   * Optimized compound earnings calculation
   */
  async compound_earnings(compoundEarning: CompoundEarningDto): Promise<any> {
    const { type, Id } = compoundEarning;
    const _model = this.model(type);
    
    const { earningIds } = await _model.findById(Id).exec();
    
    const results = await Promise.all(
      earningIds.map(async (ob: any) => {
        const model = this.model(ob.type);
        const esr = `total_earn_${ob.type}`;
        
        const pipeline = [
          {
            $match: {
              _id: { $in: ob.earningIds.map((id: any) => new Types.ObjectId(id)) }
            }
          },
          {
            $group: {
              _id: null,
              totalAmount: { $sum: '$amount' },
              currency: { $first: '$currency' },
              totalPeriod: { $sum: "$period" },
              count: { $sum: 1 },
              avgAmount: { $avg: '$amount' }
            }
          },
          {
            $addFields: {
              title: `${esr} for ${totalPeriod} months`,
              type: ob.type
            }
          }
        ];

        const options: AggregationOptions = {
          useCache: true,
          cacheTTL: 1800, // 30 minutes
          useReadReplica: true,
          allowDiskUse: false,
          maxTimeMS: 10000,
        };

        const result = await this.aggregationService.executeAggregation(
          model,
          pipeline,
          options
        );

        return {
          forType: ob.type,
          earnings: result.data[0] || null
        };
      })
    );

    // Create compound earning records
    const createdEarnings = await Promise.all(
      results.map(async (el) => {
        if (el.earnings) {
          const model = this.model(el.forType);
          return await model.create(el.earnings);
        }
        return null;
      })
    );

    // Invalidate related caches
    await this.invalidateRelatedCaches(type, Id);

    return createdEarnings.filter(Boolean);
  }

  /**
   * Get project earnings with advanced aggregation and caching
   */
  async getProjectEarnings(
    projectId: string,
    dateRange?: { start: Date; end: Date },
    groupBy: 'month' | 'quarter' | 'year' = 'month',
    options: AggregationOptions = {}
  ): Promise<{
    earnings: any[];
    summary: any;
    fromCache: boolean;
    executionTime: number;
  }> {
    const matchConditions: any = { project: new Types.ObjectId(projectId) };
    
    if (dateRange) {
      matchConditions.createdAt = {
        $gte: dateRange.start,
        $lte: dateRange.end,
      };
    }

    // Dynamic grouping based on period
    const getGroupingFields = () => {
      const baseFields = {
        project: "$project",
        currency: "$currency",
        year: { $year: "$createdAt" }
      };

      switch (groupBy) {
        case 'month':
          return { ...baseFields, month: { $month: "$createdAt" } };
        case 'quarter':
          return { 
            ...baseFields, 
            quarter: { 
              $ceil: { $divide: [{ $month: "$createdAt" }, 3] } 
            } 
          };
        case 'year':
          return baseFields;
        default:
          return { ...baseFields, month: { $month: "$createdAt" } };
      }
    };

    const pipeline = [
      { $match: matchConditions },
      {
        $group: {
          _id: getGroupingFields(),
          totalAmount: { $sum: "$amount" },
          totalPeriod: { $sum: "$period" },
          count: { $sum: 1 },
          avgAmount: { $avg: "$amount" },
          minAmount: { $min: "$amount" },
          maxAmount: { $max: "$amount" },
          earnings: {
            $push: {
              _id: "$_id",
              amount: "$amount",
              period: "$period",
              createdAt: "$createdAt",
              title: "$title"
            }
          }
        }
      },
      {
        $lookup: {
          from: "projects",
          localField: "_id.project",
          foreignField: "_id",
          as: "projectInfo",
          pipeline: [
            { $project: { title: 1, status: 1, startDate: 1, endDate: 1 } }
          ]
        }
      },
      {
        $addFields: {
          projectInfo: { $arrayElemAt: ["$projectInfo", 0] },
          period: groupBy,
          periodValue: {
            $switch: {
              branches: [
                { case: { $eq: [groupBy, 'month'] }, then: "$_id.month" },
                { case: { $eq: [groupBy, 'quarter'] }, then: "$_id.quarter" },
                { case: { $eq: [groupBy, 'year'] }, then: "$_id.year" }
              ],
              default: "$_id.month"
            }
          }
        }
      },
      {
        $sort: { "_id.year": -1, "periodValue": -1 }
      },
      {
        $facet: {
          earnings: [
            { $limit: 100 } // Limit results for performance
          ],
          summary: [
            {
              $group: {
                _id: null,
                totalEarnings: { $sum: "$totalAmount" },
                totalRecords: { $sum: "$count" },
                avgPeriodAmount: { $avg: "$totalAmount" },
                currencies: { $addToSet: "$_id.currency" },
                periodCount: { $sum: 1 }
              }
            }
          ]
        }
      }
    ];

    const defaultOptions: AggregationOptions = {
      useCache: true,
      cacheTTL: 1800, // 30 minutes
      useReadReplica: true,
      allowDiskUse: true,
      maxTimeMS: 20000,
      hint: { project: 1, createdAt: -1 },
      ...options
    };

    const result = await this.aggregationService.executeAggregation<any>(
      this.pearnModel,
      pipeline,
      defaultOptions
    );

    const data = result.data[0];
    const earnings = data?.earnings || [];
    const summary = data?.summary[0] || {
      totalEarnings: 0,
      totalRecords: 0,
      avgPeriodAmount: 0,
      currencies: [],
      periodCount: 0
    };

    return {
      earnings,
      summary,
      fromCache: result.fromCache,
      executionTime: result.executionTime
    };
  }

  /**
   * Get organization earnings summary with caching
   */
  async getOrgzEarningsSummary(
    orgzId: string,
    options: AggregationOptions = {}
  ): Promise<{
    summary: any;
    fromCache: boolean;
    executionTime: number;
  }> {
    const pipeline = [
      { $match: { orgz: new Types.ObjectId(orgzId) } },
      {
        $lookup: {
          from: "projectearnings",
          localField: "earningIds.id",
          foreignField: "_id",
          as: "projectEarnings",
          pipeline: [
            { $project: { amount: 1, currency: 1, period: 1, createdAt: 1 } }
          ]
        }
      },
      {
        $unwind: {
          path: "$projectEarnings",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: {
            orgz: "$orgz",
            currency: "$projectEarnings.currency"
          },
          totalAmount: { $sum: "$projectEarnings.amount" },
          totalPeriod: { $sum: "$projectEarnings.period" },
          count: { $sum: 1 },
          avgAmount: { $avg: "$projectEarnings.amount" },
          latestEarning: { $max: "$projectEarnings.createdAt" }
        }
      },
      {
        $group: {
          _id: "$_id.orgz",
          currencyBreakdown: {
            $push: {
              currency: "$_id.currency",
              totalAmount: "$totalAmount",
              count: "$count",
              avgAmount: "$avgAmount"
            }
          },
          overallTotal: { $sum: "$totalAmount" },
          overallCount: { $sum: "$count" },
          overallAvg: { $avg: "$avgAmount" },
          latestActivity: { $max: "$latestEarning" }
        }
      },
      {
        $lookup: {
          from: "organizations",
          localField: "_id",
          foreignField: "_id",
          as: "orgInfo",
          pipeline: [
            { $project: { name: 1, description: 1 } }
          ]
        }
      },
      {
        $addFields: {
          organization: { $arrayElemAt: ["$orgInfo", 0] }
        }
      },
      {
        $project: {
          orgInfo: 0
        }
      }
    ];

    const defaultOptions: AggregationOptions = {
      useCache: true,
      cacheTTL: 3600, // 1 hour
      useReadReplica: true,
      allowDiskUse: true,
      maxTimeMS: 15000,
      hint: { orgz: 1 },
      ...options
    };

    const result = await this.aggregationService.executeAggregation<any>(
      this.orgsearnModel,
      pipeline,
      defaultOptions
    );

    return {
      summary: result.data[0] || null,
      fromCache: result.fromCache,
      executionTime: result.executionTime
    };
  }

  /**
   * Get top earning projects with caching
   */
  async getTopEarningProjects(
    limit: number = 10,
    dateRange?: { start: Date; end: Date },
    options: AggregationOptions = {}
  ): Promise<{
    projects: any[];
    fromCache: boolean;
    executionTime: number;
  }> {
    const matchConditions: any = {};
    
    if (dateRange) {
      matchConditions.createdAt = {
        $gte: dateRange.start,
        $lte: dateRange.end,
      };
    }

    const pipeline = [
      ...(Object.keys(matchConditions).length > 0 ? [{ $match: matchConditions }] : []),
      {
        $group: {
          _id: "$project",
          totalEarnings: { $sum: "$amount" },
          totalPeriod: { $sum: "$period" },
          earningCount: { $sum: 1 },
          avgEarning: { $avg: "$amount" },
          latestEarning: { $max: "$createdAt" },
          currencies: { $addToSet: "$currency" }
        }
      },
      {
        $lookup: {
          from: "projects",
          localField: "_id",
          foreignField: "_id",
          as: "projectInfo",
          pipeline: [
            { 
              $project: { 
                title: 1, 
                status: 1, 
                startDate: 1, 
                endDate: 1,
                description: 1
              } 
            }
          ]
        }
      },
      {
        $addFields: {
          project: { $arrayElemAt: ["$projectInfo", 0] }
        }
      },
      {
        $sort: { totalEarnings: -1 }
      },
      {
        $limit: limit
      },
      {
        $project: {
          projectInfo: 0
        }
      }
    ];

    const defaultOptions: AggregationOptions = {
      useCache: true,
      cacheTTL: 1800, // 30 minutes
      useReadReplica: true,
      allowDiskUse: false,
      maxTimeMS: 10000,
      hint: { project: 1, amount: -1 },
      ...options
    };

    const result = await this.aggregationService.executeAggregation<any>(
      this.pearnModel,
      pipeline,
      defaultOptions
    );

    return {
      projects: result.data,
      fromCache: result.fromCache,
      executionTime: result.executionTime
    };
  }

  /**
   * Find earning by ID with caching
   */
  async find_Id(_id: string, type: string): Promise<Earning> {
    const model = this.model(type);
    
    try {
      // Try cache first
      const cached = await this.cacheService.getAggregation({
        collection: type === 'project' ? 'projectearnings' : 'orgzearnings',
        pipeline: JSON.stringify([{ $match: { _id: new Types.ObjectId(_id) } }])
      });
      
      if (cached && cached.length > 0) {
        return cached[0];
      }

      // Fallback to database
      const earning = await model.findById(_id).exec();
      
      // Cache the result
      if (earning) {
        await this.cacheService.setAggregation(
          {
            collection: type === 'project' ? 'projectearnings' : 'orgzearnings',
            pipeline: JSON.stringify([{ $match: { _id: new Types.ObjectId(_id) } }])
          },
          [earning],
          { ttl: 1800 } // 30 minutes
        );
      }

      return earning;
    } catch (error) {
      this.logger.error(`Error finding earning ${_id} of type ${type}:`, error);
      throw error;
    }
  }

  /**
   * Invalidate related caches
   */
  private async invalidateRelatedCaches(type: string, relatedId: string): Promise<void> {
    try {
      const collectionName = type === 'project' ? 'projectearnings' : 'orgzearnings';
      
      // Invalidate collection-specific caches
      await this.cacheService.invalidateCollection(collectionName);
      
      // Invalidate related entity caches
      await this.cacheService.invalidatePattern(`*${type}:${relatedId}*`);

      this.logger.debug(`Invalidated caches for ${type} earning related to ${relatedId}`);
    } catch (error) {
      this.logger.error('Error invalidating related caches:', error);
    }
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(): Promise<any> {
    return await this.aggregationService.getPerformanceMetrics();
  }
}

