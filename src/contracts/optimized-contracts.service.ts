import { Injectable, Logger } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateContractDto } from './dto/create-contract.dto';
import { Contract } from './interface/contract';
import { Employee, UsersService } from "../users/";
import { Offer, OfferService } from '../offers/';
import { AggregationService, AggregationOptions } from '../aggregation/aggregation.service';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class OptimizedContractService {
  private readonly logger = new Logger(OptimizedContractService.name);

  constructor(
    @InjectModel('Contract') private readonly contractModel: Model<Contract>,
    private readonly aggregationService: AggregationService,
    private readonly cacheService: CacheService,
    private userService: UsersService,
    private offerService: OfferService,
  ) {}

  /**
   * Create contract with cache invalidation
   */
  async create(createContractDto: CreateContractDto): Promise<Contract> {
    const { clientId, employeeId, offerId, ...rest } = createContractDto;
    const [client, employee] = await this.userService.findMany_Id([clientId, employeeId]);
    const createdContract = new this.contractModel({ _id: new Types.ObjectId(), ...rest });
    
    createdContract.client = client;
    createdContract.employee = employee;
    
    if (offerId && offerId !== "") {
      const result = await this.createFrom_Offer(offerId, createdContract);
      // Invalidate related caches
      await this.invalidateRelatedCaches(result);
      return result;
    }

    const result = await createdContract.save();
    // Invalidate related caches
    await this.invalidateRelatedCaches(result);
    return result;
  }

  /**
   * Create contract from offer with optimization
   */
  async createFrom_Offer(offerId: string, contract: any): Promise<Contract> {
    const offer = await this.offerService.find_Id(offerId);
    
    if (offer.status === "Accept_Client") {
      const createdContract = contract;
      createdContract.offerId = offer._id;
      createdContract.client = offer.client;
      createdContract.employee = offer.employee;
      return await createdContract.save();
    } else {
      return contract;
    }
  }

  /**
   * Optimized employee lookup with caching and read replica
   */
  async employee_all(
    cid: string, 
    options: AggregationOptions = {}
  ): Promise<{ employees: Employee[]; fromCache: boolean; executionTime: number }> {
    const pipeline = [
      { $match: { _id: new Types.ObjectId(cid) } },
      {
        $lookup: {
          from: "users",
          localField: "employee",
          foreignField: "_id",
          as: "employees",
          pipeline: [
            // Exclude sensitive fields and optimize projection
            { 
              $project: { 
                _id: 1,
                name: 1,
                email: 1,
                role: 1,
                profileImage: 1,
                isActive: 1,
                createdAt: 1,
                // Exclude password, sensitive data
                password: 0,
                __v: 0
              } 
            }
          ]
        }
      },
      {
        $project: {
          employees: 1,
          _id: 1,
          title: 1,
          status: 1,
          amount: 1,
          currency: 1
        }
      }
    ];

    const defaultOptions: AggregationOptions = {
      useCache: true,
      cacheTTL: 1800, // 30 minutes
      useReadReplica: true,
      allowDiskUse: false, // Simple query, no need for disk
      maxTimeMS: 5000,
      hint: { _id: 1 }, // Use _id index
      ...options
    };

    try {
      const result = await this.aggregationService.executeAggregation<any>(
        this.contractModel,
        pipeline,
        defaultOptions
      );

      const employees = result.data[0]?.employees || [];
      
      this.logger.debug(
        `Retrieved ${employees.length} employees for contract ${cid} ` +
        `(fromCache: ${result.fromCache}, executionTime: ${result.executionTime}ms)`
      );

      return {
        employees,
        fromCache: result.fromCache,
        executionTime: result.executionTime
      };
    } catch (error) {
      this.logger.error(`Error retrieving employees for contract ${cid}:`, error);
      throw error;
    }
  }

  /**
   * Get contract with related data (optimized aggregation)
   */
  async getContractWithDetails(
    contractId: string,
    options: AggregationOptions = {}
  ): Promise<{
    contract: any;
    fromCache: boolean;
    executionTime: number;
  }> {
    const pipeline = [
      { $match: { _id: new Types.ObjectId(contractId) } },
      {
        $lookup: {
          from: "users",
          localField: "client",
          foreignField: "_id",
          as: "clientInfo",
          pipeline: [
            { 
              $project: { 
                _id: 1, name: 1, email: 1, role: 1, 
                password: 0, __v: 0 
              } 
            }
          ]
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "employee",
          foreignField: "_id",
          as: "employeeInfo",
          pipeline: [
            { 
              $project: { 
                _id: 1, name: 1, email: 1, role: 1, profileImage: 1,
                password: 0, __v: 0 
              } 
            }
          ]
        }
      },
      {
        $lookup: {
          from: "projects",
          localField: "_id",
          foreignField: "contract",
          as: "projects",
          pipeline: [
            { $project: { title: 1, status: 1, startDate: 1, endDate: 1 } }
          ]
        }
      },
      {
        $lookup: {
          from: "payments",
          localField: "_id",
          foreignField: "contract",
          as: "payments",
          pipeline: [
            { $project: { amount: 1, currency: 1, status: 1, processedAt: 1 } },
            { $sort: { processedAt: -1 } },
            { $limit: 10 } // Latest 10 payments
          ]
        }
      },
      {
        $addFields: {
          client: { $arrayElemAt: ["$clientInfo", 0] },
          employee: { $arrayElemAt: ["$employeeInfo", 0] },
          totalPayments: { $sum: "$payments.amount" },
          projectCount: { $size: "$projects" }
        }
      },
      {
        $project: {
          clientInfo: 0,
          employeeInfo: 0,
          __v: 0
        }
      }
    ];

    const defaultOptions: AggregationOptions = {
      useCache: true,
      cacheTTL: 900, // 15 minutes
      useReadReplica: true,
      allowDiskUse: false,
      maxTimeMS: 10000,
      hint: { _id: 1 },
      ...options
    };

    const result = await this.aggregationService.executeAggregation<any>(
      this.contractModel,
      pipeline,
      defaultOptions
    );

    return {
      contract: result.data[0] || null,
      fromCache: result.fromCache,
      executionTime: result.executionTime
    };
  }

  /**
   * Get contracts by client with pagination and caching
   */
  async getContractsByClient(
    clientId: string,
    page: number = 1,
    limit: number = 10,
    options: AggregationOptions = {}
  ): Promise<{
    contracts: any[];
    total: number;
    page: number;
    totalPages: number;
    fromCache: boolean;
    executionTime: number;
  }> {
    const skip = (page - 1) * limit;
    
    const pipeline = [
      { $match: { client: new Types.ObjectId(clientId) } },
      {
        $facet: {
          contracts: [
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
              $lookup: {
                from: "users",
                localField: "employee",
                foreignField: "_id",
                as: "employeeInfo",
                pipeline: [
                  { $project: { _id: 1, name: 1, email: 1, role: 1 } }
                ]
              }
            },
            {
              $addFields: {
                employee: { $arrayElemAt: ["$employeeInfo", 0] }
              }
            },
            {
              $project: {
                employeeInfo: 0,
                __v: 0
              }
            }
          ],
          totalCount: [
            { $count: "count" }
          ]
        }
      }
    ];

    const defaultOptions: AggregationOptions = {
      useCache: true,
      cacheTTL: 600, // 10 minutes
      useReadReplica: true,
      allowDiskUse: false,
      maxTimeMS: 15000,
      hint: { client: 1, createdAt: -1 },
      ...options
    };

    const result = await this.aggregationService.executeAggregation<any>(
      this.contractModel,
      pipeline,
      defaultOptions
    );

    const data = result.data[0];
    const contracts = data?.contracts || [];
    const total = data?.totalCount[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      contracts,
      total,
      page,
      totalPages,
      fromCache: result.fromCache,
      executionTime: result.executionTime
    };
  }

  /**
   * Get contract statistics with caching
   */
  async getContractStatistics(
    dateRange?: { start: Date; end: Date },
    options: AggregationOptions = {}
  ): Promise<{
    statistics: any;
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
          _id: null,
          totalContracts: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
          avgAmount: { $avg: "$amount" },
          statusBreakdown: {
            $push: "$status"
          },
          currencyBreakdown: {
            $push: "$currency"
          }
        }
      },
      {
        $addFields: {
          statusCounts: {
            $reduce: {
              input: "$statusBreakdown",
              initialValue: {},
              in: {
                $mergeObjects: [
                  "$$value",
                  {
                    $arrayToObject: [
                      [{ k: "$$this", v: { $add: [{ $ifNull: [{ $getField: { field: "$$this", input: "$$value" } }, 0] }, 1] } }]
                    ]
                  }
                ]
              }
            }
          },
          currencyCounts: {
            $reduce: {
              input: "$currencyBreakdown",
              initialValue: {},
              in: {
                $mergeObjects: [
                  "$$value",
                  {
                    $arrayToObject: [
                      [{ k: "$$this", v: { $add: [{ $ifNull: [{ $getField: { field: "$$this", input: "$$value" } }, 0] }, 1] } }]
                    ]
                  }
                ]
              }
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalContracts: 1,
          totalAmount: 1,
          avgAmount: 1,
          statusCounts: 1,
          currencyCounts: 1
        }
      }
    ];

    const defaultOptions: AggregationOptions = {
      useCache: true,
      cacheTTL: 3600, // 1 hour
      useReadReplica: true,
      allowDiskUse: true,
      maxTimeMS: 20000,
      ...options
    };

    const result = await this.aggregationService.executeAggregation<any>(
      this.contractModel,
      pipeline,
      defaultOptions
    );

    return {
      statistics: result.data[0] || {
        totalContracts: 0,
        totalAmount: 0,
        avgAmount: 0,
        statusCounts: {},
        currencyCounts: {}
      },
      fromCache: result.fromCache,
      executionTime: result.executionTime
    };
  }

  /**
   * Find contract by ID with caching
   */
  async find_Id(_id: string): Promise<Contract> {
    // For simple finds, we can use model cache or implement simple caching
    const cacheKey = `contract:${_id}`;
    
    try {
      // Try cache first
      const cached = await this.cacheService.getAggregation({
        collection: 'contracts',
        pipeline: JSON.stringify([{ $match: { _id: new Types.ObjectId(_id) } }])
      });
      
      if (cached && cached.length > 0) {
        return cached[0];
      }

      // Fallback to database
      const contract = await this.contractModel.findById(_id).exec();
      
      // Cache the result
      if (contract) {
        await this.cacheService.setAggregation(
          {
            collection: 'contracts',
            pipeline: JSON.stringify([{ $match: { _id: new Types.ObjectId(_id) } }])
          },
          [contract],
          { ttl: 1800 } // 30 minutes
        );
      }

      return contract;
    } catch (error) {
      this.logger.error(`Error finding contract ${_id}:`, error);
      throw error;
    }
  }

  /**
   * Invalidate related caches when contract is modified
   */
  private async invalidateRelatedCaches(contract: Contract): Promise<void> {
    try {
      // Invalidate contract-specific caches
      await this.cacheService.invalidateCollection('contracts');
      
      // Invalidate related user caches if needed
      if (contract.client) {
        await this.cacheService.invalidatePattern(`*client:${contract.client}*`);
      }
      
      if (contract.employee) {
        await this.cacheService.invalidatePattern(`*employee:${contract.employee}*`);
      }

      this.logger.debug(`Invalidated caches for contract ${contract._id}`);
    } catch (error) {
      this.logger.error('Error invalidating related caches:', error);
    }
  }

  /**
   * Get performance metrics for contract operations
   */
  async getPerformanceMetrics(): Promise<any> {
    return await this.aggregationService.getPerformanceMetrics();
  }
}

