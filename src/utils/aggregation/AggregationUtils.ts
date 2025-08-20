/**
 * AggregationUtils - Utility functions for common aggregation patterns
 * 
 * Provides pre-built aggregation patterns and helper functions for common
 * database operations in the Nestcms application.
 */

import { Types, PipelineStage } from 'mongoose';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AggregationBuilder } from './AggregationBuilder';
import { 
  UserLookupDto, 
  ProjectLookupDto, 
  ContractLookupDto, 
  ConditionalLookupDto,
  LookupResult
} from './dto/lookup.dto';

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
   * @param options User lookup options or localField
   * @param as User field name in result
   * @param project Optional projection
   * @returns Pipeline stage for user lookup
   */
  static createUserLookup(
    options: UserLookupDto | string = 'userId',
    as: string = 'user',
    project?: object
  ): PipelineStage {
    // Handle both object and string parameters for backward compatibility
    let dto: UserLookupDto;
    
    if (typeof options === 'string') {
      dto = {
        localField: options,
        as,
        project
      };
    } else {
      dto = options;
    }
    
    // Transform plain object to class instance
    const userLookupDto = plainToInstance(UserLookupDto, dto);
    
    // Create the lookup object with proper typing
    const lookup: LookupResult['$lookup'] = {
      from: 'users',
      localField: userLookupDto.localField || 'userId',
      foreignField: '_id',
      as: userLookupDto.as || 'user'
    };

    // Add projection if provided
    if (userLookupDto.project) {
      lookup.pipeline = [{ $project: userLookupDto.project }];
    }

    return { $lookup: lookup };
  }

  /**
   * Create a lookup stage for project relationships
   * @param options Project lookup options or localField
   * @param as Project field name in result
   * @param includeDetails Whether to include all project details
   * @returns Pipeline stage for project lookup
   */
  static createProjectLookup(
    options: ProjectLookupDto | string = 'projectId',
    as: string = 'project',
    includeDetails: boolean = false
  ): PipelineStage {
    // Handle both object and string parameters for backward compatibility
    let dto: ProjectLookupDto;
    
    if (typeof options === 'string') {
      dto = {
        localField: options,
        as,
        includeDetails
      };
    } else {
      dto = options;
    }
    
    // Transform plain object to class instance
    const projectLookupDto = plainToInstance(ProjectLookupDto, dto);
    
    const pipeline: PipelineStage[] = [];
    
    // Add projection if not including all details
    if (projectLookupDto.includeDetails !== true) {
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

    // Create the lookup object with proper typing
    const lookup: LookupResult['$lookup'] = {
      from: 'projects',
      localField: projectLookupDto.localField || 'projectId',
      foreignField: '_id',
      as: projectLookupDto.as || 'project',
      ...(pipeline.length > 0 && { pipeline })
    };

    return { $lookup: lookup };
  }

  /**
   * Create a lookup stage for contract relationships
   * @param options Contract lookup options or localField
   * @param as Contract field name in result
   * @returns Pipeline stage for contract lookup
   */
  static createContractLookup(
    options: ContractLookupDto | string = 'contractId',
    as: string = 'contract'
  ): PipelineStage {
    // Handle both object and string parameters for backward compatibility
    let dto: ContractLookupDto;
    
    if (typeof options === 'string') {
      dto = {
        localField: options,
        as
      };
    } else {
      dto = options;
    }
    
    // Transform plain object to class instance
    const contractLookupDto = plainToInstance(ContractLookupDto, dto);
    
    // Create the lookup object with proper typing
    const lookup: LookupResult['$lookup'] = {
      from: 'contracts',
      localField: contractLookupDto.localField || 'contractId',
      foreignField: '_id',
      as: contractLookupDto.as || 'contract'
    };

    return { $lookup: lookup };
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
   * @param options Conditional lookup options
   * @returns Pipeline stage for conditional lookup
   */
  static createConditionalLookup(options: ConditionalLookupDto): PipelineStage {
    // Transform plain object to class instance
    const conditionalLookupDto = plainToInstance(ConditionalLookupDto, options);
    
    // Validate the DTO
    validate(conditionalLookupDto).catch(errors => {
      console.warn('Validation errors in conditional lookup:', errors);
    });
    
    const pipeline: PipelineStage[] = [];
    
    // Add conditional stages to pipeline
    if (conditionalLookupDto.condition) {
      pipeline.push({ $match: conditionalLookupDto.condition });
    }
    
    if (conditionalLookupDto.sort) {
      pipeline.push({ $sort: conditionalLookupDto.sort });
    }
    
    if (conditionalLookupDto.limit !== undefined && conditionalLookupDto.limit > 0) {
      pipeline.push({ $limit: conditionalLookupDto.limit });
    }
    
    if (conditionalLookupDto.project) {
      pipeline.push({ $project: conditionalLookupDto.project });
    }

    // Create the lookup object with proper typing
    const lookup: LookupResult['$lookup'] = {
      from: conditionalLookupDto.from,
      localField: conditionalLookupDto.localField,
      foreignField: conditionalLookupDto.foreignField || '_id',
      as: conditionalLookupDto.as,
      ...(pipeline.length > 0 && { pipeline })
    };

    return { $lookup: lookup };
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
