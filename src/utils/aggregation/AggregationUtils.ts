/**
 * AggregationUtils - Utility functions for common aggregation patterns
 * 
 * Provides pre-built aggregation patterns and helper functions for common
 * database operations in the Nestcms application.
 */

import { Types, PipelineStage, Document } from 'mongoose';
import { AggregationBuilder } from './AggregationBuilder';

/**
 * Interface for date range filtering
 */
export interface DateRange {
  from?: Date;
  to?: Date;
}

/**
 * Interface for lookup options
 */
export interface LookupOptions {
  from: string;
  localField: string;
  foreignField?: string;
  as: string;
  pipeline?: PipelineStage[];
}

/**
 * Interface for conditional lookup options
 */
export interface ConditionalLookupOptions extends LookupOptions {
  condition?: Record<string, any>;
  project?: Record<string, any>;
  sort?: Record<string, any>;
  limit?: number;
}

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
   * @param field The field to apply date range filtering to
   * @param dateRange Optional date range with from and to dates
   * @returns A MongoDB match condition object
   */
  static createDateRangeMatch(
    field: string, 
    dateRange?: DateRange
  ): Record<string, any> {
    if (!dateRange) return {};
    
    const match: Record<string, any> = {};
    
    // Only create condition if at least one date is provided
    if (dateRange.from || dateRange.to) {
      match[field] = {};
      
      // Add greater than or equal condition for from date
      if (dateRange.from) {
        match[field].$gte = dateRange.from;
      }
      
      // Add less than or equal condition for to date
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
   * @param localField Field containing the user ID reference (default: 'userId')
   * @param as Name for the output array field (default: 'user')
   * @param project Optional projection to apply to the looked-up documents
   * @returns A MongoDB $lookup pipeline stage
   */
  static createUserLookup(
    localField: string = 'userId',
    as: string = 'user',
    project?: Record<string, any>
  ): PipelineStage {
    // Create lookup options
    const lookupOptions: LookupOptions = {
      from: 'users',
      localField,
      foreignField: '_id',
      as
    };
    
    // Add projection pipeline if provided
    if (project) {
      lookupOptions.pipeline = [{ $project: project }];
    }
    
    // Return the lookup stage
    return { $lookup: lookupOptions };
  }
  
  /**
   * Create a lookup stage for user relationships using AggregationBuilder
   * @param builder The AggregationBuilder instance to add the lookup to
   * @param localField Field containing the user ID reference (default: 'userId')
   * @param as Name for the output array field (default: 'user')
   * @param project Optional projection to apply to the looked-up documents
   * @returns The updated AggregationBuilder instance
   */
  static addUserLookup(
    builder: AggregationBuilder,
    localField: string = 'userId',
    as: string = 'user',
    project?: Record<string, any>
  ): AggregationBuilder {
    return builder.lookup(this.createUserLookup(localField, as, project).$lookup);
  }

  /**
   * Create a lookup stage for project relationships
   * @param localField Field containing the project ID reference (default: 'projectId')
   * @param as Name for the output array field (default: 'project')
   * @param includeDetails Whether to include all project details (default: false)
   * @returns A MongoDB $lookup pipeline stage
   */
  static createProjectLookup(
    localField: string = 'projectId',
    as: string = 'project',
    includeDetails: boolean = false
  ): PipelineStage {
    // Create lookup options
    const lookupOptions: LookupOptions = {
      from: 'projects',
      localField,
      foreignField: '_id',
      as
    };
    
    // Add projection pipeline if not including all details
    if (!includeDetails) {
      lookupOptions.pipeline = [{
        $project: {
          title: 1,
          description: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1
        }
      }];
    }
    
    // Return the lookup stage
    return { $lookup: lookupOptions };
  }
  
  /**
   * Create a lookup stage for project relationships using AggregationBuilder
   * @param builder The AggregationBuilder instance to add the lookup to
   * @param localField Field containing the project ID reference (default: 'projectId')
   * @param as Name for the output array field (default: 'project')
   * @param includeDetails Whether to include all project details (default: false)
   * @returns The updated AggregationBuilder instance
   */
  static addProjectLookup(
    builder: AggregationBuilder,
    localField: string = 'projectId',
    as: string = 'project',
    includeDetails: boolean = false
  ): AggregationBuilder {
    return builder.lookup(this.createProjectLookup(localField, as, includeDetails).$lookup);
  }

  /**
   * Create a lookup stage for contract relationships
   * @param localField Field containing the contract ID reference (default: 'contractId')
   * @param as Name for the output array field (default: 'contract')
   * @returns A MongoDB $lookup pipeline stage
   */
  static createContractLookup(
    localField: string = 'contractId',
    as: string = 'contract'
  ): PipelineStage {
    // Create lookup options
    const lookupOptions: LookupOptions = {
      from: 'contracts',
      localField,
      foreignField: '_id',
      as
    };
    
    // Return the lookup stage
    return { $lookup: lookupOptions };
  }
  
  /**
   * Create a lookup stage for contract relationships using AggregationBuilder
   * @param builder The AggregationBuilder instance to add the lookup to
   * @param localField Field containing the contract ID reference (default: 'contractId')
   * @param as Name for the output array field (default: 'contract')
   * @returns The updated AggregationBuilder instance
   */
  static addContractLookup(
    builder: AggregationBuilder,
    localField: string = 'contractId',
    as: string = 'contract'
  ): AggregationBuilder {
    return builder.lookup(this.createContractLookup(localField, as).$lookup);
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
   * @param options Conditional lookup options including filtering, sorting, and projection
   * @returns A MongoDB $lookup pipeline stage with conditional pipeline
   */
  static createConditionalLookup(options: ConditionalLookupOptions): PipelineStage {
    // Create base lookup options
    const lookupOptions: LookupOptions = {
      from: options.from,
      localField: options.localField,
      foreignField: options.foreignField || '_id',
      as: options.as
    };
    
    // Build pipeline stages if any conditions are specified
    const pipeline: PipelineStage[] = [];
    
    // Add match condition if provided
    if (options.condition) {
      pipeline.push({ $match: options.condition });
    }
    
    // Add sort if provided
    if (options.sort) {
      pipeline.push({ $sort: options.sort });
    }
    
    // Add limit if provided
    if (options.limit !== undefined && options.limit > 0) {
      pipeline.push({ $limit: options.limit });
    }
    
    // Add projection if provided
    if (options.project) {
      pipeline.push({ $project: options.project });
    }
    
    // Add pipeline to lookup options if any stages were added
    if (pipeline.length > 0) {
      lookupOptions.pipeline = pipeline;
    }
    
    // Return the lookup stage
    return { $lookup: lookupOptions };
  }
  
  /**
   * Create a conditional lookup stage using AggregationBuilder
   * @param builder The AggregationBuilder instance to add the lookup to
   * @param options Conditional lookup options
   * @returns The updated AggregationBuilder instance
   */
  static addConditionalLookup(
    builder: AggregationBuilder,
    options: ConditionalLookupOptions
  ): AggregationBuilder {
    return builder.lookup(this.createConditionalLookup(options).$lookup);
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
   * @param entityType Type of entity to build timeline for ('user', 'project', or 'contract')
   * @param entityId ID of the entity
   * @param limit Maximum number of timeline items to return (default: 20)
   * @returns An AggregationBuilder instance configured for activity timeline
   * @throws Error if entityId is invalid or entityType is not supported
   */
  static buildActivityTimeline(
    entityType: 'user' | 'project' | 'contract',
    entityId: string,
    limit: number = 20
  ): AggregationBuilder {
    // Validate inputs
    if (!entityId) {
      throw new Error('Entity ID is required for activity timeline');
    }
    
    if (limit <= 0) {
      throw new Error('Limit must be a positive number');
    }
    
    // Create a new builder
    const builder = AggregationBuilder.create();
    
    try {
      // Convert entityId to ObjectId safely
      const objectId = new Types.ObjectId(entityId);
      
      // Match based on entity type
      switch (entityType) {
        case 'user':
          builder.match({
            $or: [
              { employee: objectId },
              { client: objectId }
            ]
          });
          break;
        case 'project':
          builder.match({ project: objectId });
          break;
        case 'contract':
          builder.match({ contract: objectId });
          break;
        default:
          throw new Error(`Unsupported entity type: ${entityType}`);
      }
      
      // Build the rest of the pipeline
      return builder
        .sort({ createdAt: -1 })
        .limit(limit)
        // Add user lookups
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
        // Project the final result
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
    } catch (error) {
      // Handle ObjectId conversion errors
      if (error instanceof Error && error.message.includes('ObjectId')) {
        throw new Error(`Invalid entity ID format: ${entityId}`);
      }
      throw error;
    }
  }
}
