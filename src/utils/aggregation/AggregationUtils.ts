/**
 * AggregationUtils - Utility functions for common aggregation patterns
 * 
 * Provides pre-built aggregation patterns and helper functions for common
 * database operations in the Nestcms application.
 */

import { Types, PipelineStage } from 'mongoose';
import { AggregationBuilder } from './AggregationBuilder';

export class AggregationUtils {
  /**
   * Create a text search match condition
   */
  static createTextSearchMatch(searchTerm: string, fields: string[]): object {
    const searchRegex = new RegExp(searchTerm, 'i');
    return {
      $or: fields.map(field => ({
        [field]: { $regex: searchRegex }
      }))
    };
  }

  /**
   * Create a date range match condition
   */
  static createDateRangeMatch(
    field: string, 
    dateRange?: { from: Date; to: Date }
  ): object {
    if (!dateRange) return {};
    
    const match: any = {};
    if (dateRange.from || dateRange.to) {
      match[field] = {};
      if (dateRange.from) {
        match[field].$gte = dateRange.from;
      }
      if (dateRange.to) {
        match[field].$lte = dateRange.to;
      }
    }
    return match;
  }

  /**
   * Create pagination pipeline stages
   */
  static createPaginationStages(page: number = 1, limit: number = 10): PipelineStage[] {
    const skip = (page - 1) * limit;
    return [
      { $skip: skip },
      { $limit: limit }
    ];
  }

  /**
   * Create a lookup stage for user relationships
   */
  static createUserLookup(
    localField: string = 'userId',
    as: string = 'user',
    project?: object
  ): PipelineStage {
    const lookup: any = {
      from: 'users',
      localField,
      foreignField: '_id',
      as
    };

    if (project) {
      lookup.pipeline = [{ $project: project }];
    }

    return { $lookup: lookup };
  }

  /**
   * Create a lookup stage for project relationships
   */
  static createProjectLookup(
    localField: string = 'projectId',
    as: string = 'project',
    includeDetails: boolean = false
  ): PipelineStage {
    const pipeline: PipelineStage[] = [];
    
    if (!includeDetails) {
      pipeline.push({
        $project: {
          title: 1,
          description: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1
        }
      });
    }

    return {
      $lookup: {
        from: 'projects',
        localField,
        foreignField: '_id',
        as,
        ...(pipeline.length > 0 && { pipeline })
      }
    };
  }

  /**
   * Create a lookup stage for contract relationships
   */
  static createContractLookup(
    localField: string = 'contractId',
    as: string = 'contract'
  ): PipelineStage {
    return {
      $lookup: {
        from: 'contracts',
        localField,
        foreignField: '_id',
        as
      }
    };
  }

  /**
   * Create aggregation for user statistics
   */
  static buildUserStatistics(dateRange?: { from: Date; to: Date }): AggregationBuilder {
    const builder = AggregationBuilder.create();
    
    if (dateRange) {
      builder.match(this.createDateRangeMatch('createdAt', dateRange));
    }

    return builder
      .group({
        _id: null,
        totalUsers: { $sum: 1 },
        employees: {
          $sum: { $cond: [{ $eq: ['$isEmployee', true] }, 1, 0] }
        },
        clients: {
          $sum: { $cond: [{ $eq: ['$isEmployee', false] }, 1, 0] }
        },
        averageProjectsPerUser: { $avg: { $size: { $ifNull: ['$projects', []] } } }
      })
      .project({
        _id: 0,
        totalUsers: 1,
        employees: 1,
        clients: 1,
        averageProjectsPerUser: { $round: ['$averageProjectsPerUser', 2] }
      });
  }

  /**
   * Create aggregation for project statistics
   */
  static buildProjectStatistics(dateRange?: { from: Date; to: Date }): AggregationBuilder {
    const builder = AggregationBuilder.create();
    
    if (dateRange) {
      builder.match(this.createDateRangeMatch('createdAt', dateRange));
    }

    return builder
      .group({
        _id: '$status',
        count: { $sum: 1 },
        totalEarnings: { $sum: { $size: { $ifNull: ['$earnings', []] } } }
      })
      .group({
        _id: null,
        statusBreakdown: {
          $push: {
            status: '$_id',
            count: '$count',
            totalEarnings: '$totalEarnings'
          }
        },
        totalProjects: { $sum: '$count' }
      })
      .project({
        _id: 0,
        totalProjects: 1,
        statusBreakdown: 1
      });
  }

  /**
   * Create aggregation for earnings analysis
   */
  static buildEarningsAnalysis(
    type: 'project' | 'orgz',
    dateRange?: { from: Date; to: Date }
  ): AggregationBuilder {
    const builder = AggregationBuilder.create();
    
    if (dateRange) {
      builder.match(this.createDateRangeMatch('createdAt', dateRange));
    }

    return builder
      .group({
        _id: '$currency',
        totalAmount: { $sum: '$amount' },
        averageAmount: { $avg: '$amount' },
        count: { $sum: 1 },
        totalPeriod: { $sum: '$period' }
      })
      .sort({ totalAmount: -1 })
      .project({
        currency: '$_id',
        totalAmount: 1,
        averageAmount: { $round: ['$averageAmount', 2] },
        count: 1,
        totalPeriod: 1,
        _id: 0
      });
  }

  /**
   * Create aggregation for contract analysis
   */
  static buildContractAnalysis(dateRange?: { from: Date; to: Date }): AggregationBuilder {
    const builder = AggregationBuilder.create();
    
    if (dateRange) {
      builder.match(this.createDateRangeMatch('createdAt', dateRange));
    }

    return builder
      .lookup({
        from: 'users',
        localField: 'employee',
        foreignField: '_id',
        as: 'employeeDetails'
      })
      .lookup({
        from: 'users',
        localField: 'client',
        foreignField: '_id',
        as: 'clientDetails'
      })
      .group({
        _id: null,
        totalContracts: { $sum: 1 },
        uniqueEmployees: { $addToSet: '$employee' },
        uniqueClients: { $addToSet: '$client' },
        contractsWithOffers: {
          $sum: { $cond: [{ $ne: ['$offerId', null] }, 1, 0] }
        }
      })
      .project({
        _id: 0,
        totalContracts: 1,
        uniqueEmployees: { $size: '$uniqueEmployees' },
        uniqueClients: { $size: '$uniqueClients' },
        contractsWithOffers: 1,
        contractsWithoutOffers: {
          $subtract: ['$totalContracts', '$contractsWithOffers']
        }
      });
  }

  /**
   * Create optimized lookup with conditional pipeline
   */
  static createConditionalLookup(options: {
    from: string;
    localField: string;
    foreignField: string;
    as: string;
    condition?: object;
    project?: object;
    sort?: object;
    limit?: number;
  }): PipelineStage {
    const pipeline: PipelineStage[] = [];
    
    if (options.condition) {
      pipeline.push({ $match: options.condition });
    }
    
    if (options.sort) {
      pipeline.push({ $sort: options.sort });
    }
    
    if (options.limit) {
      pipeline.push({ $limit: options.limit });
    }
    
    if (options.project) {
      pipeline.push({ $project: options.project });
    }

    return {
      $lookup: {
        from: options.from,
        localField: options.localField,
        foreignField: options.foreignField,
        as: options.as,
        ...(pipeline.length > 0 && { pipeline })
      }
    };
  }

  /**
   * Create aggregation for top performers analysis
   */
  static buildTopPerformersAnalysis(limit: number = 10): AggregationBuilder {
    return AggregationBuilder.create()
      .match({ isEmployee: true })
      .lookup({
        from: 'projects',
        localField: '_id',
        foreignField: 'employee',
        as: 'projects'
      })
      .lookup({
        from: 'contracts',
        localField: '_id',
        foreignField: 'employee',
        as: 'contracts'
      })
      .addFields({
        projectCount: { $size: '$projects' },
        contractCount: { $size: '$contracts' },
        totalEarnings: {
          $sum: {
            $map: {
              input: '$projects',
              as: 'project',
              in: { $size: { $ifNull: ['$$project.earnings', []] } }
            }
          }
        }
      })
      .sort({ totalEarnings: -1, projectCount: -1 })
      .limit(limit)
      .project({
        name: 1,
        email: 1,
        employeeType: 1,
        projectCount: 1,
        contractCount: 1,
        totalEarnings: 1,
        performanceScore: {
          $add: [
            { $multiply: ['$projectCount', 2] },
            { $multiply: ['$contractCount', 1.5] },
            { $multiply: ['$totalEarnings', 0.1] }
          ]
        }
      });
  }

  /**
   * Create aggregation for activity timeline
   */
  static buildActivityTimeline(
    entityType: 'user' | 'project' | 'contract',
    entityId: string,
    limit: number = 20
  ): AggregationBuilder {
    const builder = AggregationBuilder.create();
    
    // Match based on entity type
    switch (entityType) {
      case 'user':
        builder.match({
          $or: [
            { employee: new Types.ObjectId(entityId) },
            { client: new Types.ObjectId(entityId) }
          ]
        });
        break;
      case 'project':
        builder.match({ project: new Types.ObjectId(entityId) });
        break;
      case 'contract':
        builder.match({ contract: new Types.ObjectId(entityId) });
        break;
    }

    return builder
      .sort({ createdAt: -1 })
      .limit(limit)
      .lookup({
        from: 'users',
        localField: 'employee',
        foreignField: '_id',
        as: 'employeeDetails'
      })
      .lookup({
        from: 'users',
        localField: 'client',
        foreignField: '_id',
        as: 'clientDetails'
      })
      .project({
        createdAt: 1,
        updatedAt: 1,
        status: 1,
        employee: { $arrayElemAt: ['$employeeDetails.name', 0] },
        client: { $arrayElemAt: ['$clientDetails.name', 0] },
        activityType: {
          $cond: [
            { $ne: ['$offerId', null] },
            'contract_from_offer',
            'direct_contract'
          ]
        }
      });
  }
}

