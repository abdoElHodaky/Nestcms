import { Injectable } from '@nestjs/common';
import { Model ,Types} from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateContractDto } from './dto/create-contract.dto';
import { Contract } from './interface/contract';
import { Employee,UsersService } from "../users/"
import { Offer,OfferService } from '../offers/';
import { AggregationBuilder, AggregationUtils } from '../utils/aggregation';
import { Cache, Monitor } from '../decorators/cache.decorator';
//import { UsersService} from "../users/users.service"
//import { OfferService} from "../offers/offers.service"

@Injectable()
export class ContractService {
  constructor(@InjectModel('Contract') private readonly contractModel: Model<Contract>) {}
  private userService:UsersService
  private offerService:OfferService
 
  async create(createContractDto: CreateContractDto): Promise<Contract> {
    const {clientId,employeeId,offerId,...rest}=createContractDto
    const [client,employee]=await this.userService.findMany_Id([clientId,employeeId])
    const createdContract = new this.contractModel({_id:new Types.ObjectId(),...rest});
    createdContract.client=client
    createdContract.employee=employee
    if (offerId!=""){
      return await this.createFrom_Offer(offerId,createdContract);
    }

    //const client =await this.userService.find_Id(CreateContractDto.clientId)
    //const employee = await this.userService.find_Id(createScheduleDto.employeeId)
    return await createdContract.save();
  }
  async createFrom_Offer(offerId:string,contract):Promise<Contract>{
    
    const offer = await this.offerService.find_Id(offerId)
    if(offer.status="Accept_Client"){
    const createdContract = contract;
    createdContract.offerId=offer._id
    createdContract.client=offer.client
    createdContract.employee=offer.employee
    return await createdContract.save()}
    else{
      return contract
    }
  
  }
  @Cache({ ttl: 10 * 60 * 1000 }) // Cache for 10 minutes
  @Monitor({ logSlowQueries: true, threshold: 500 })
  async employee_all(cid: string): Promise<Employee[]> {
    try {
      const result = await AggregationBuilder.create()
        .match({ _id: new Types.ObjectId(cid) })
        .lookup({
          from: 'users',
          localField: 'employee',
          foreignField: '_id',
          as: 'employees'
        })
        .project({
          employees: 1,
          _id: 0
        })
        .hint({ _id: 1 }) // Use _id index for better performance
        .comment('ContractService.employee_all - Get employees for contract')
        .execute(this.contractModel);

      return result.length > 0 ? result[0].employees : [];
    } catch (error) {
      console.error('Error in employee_all:', error);
      throw new Error(`Failed to fetch employees for contract ${cid}: ${error.message}`);
    }
  }
  async find_Id(_id:string):Promise<Contract>{
    return await this.contractModel.findById(_id).exec()
  }

  /**
   * Get contract statistics with optimized aggregation
   */
  @Cache({ ttl: 15 * 60 * 1000 }) // Cache for 15 minutes
  @Monitor({ logSlowQueries: true, threshold: 1000 })
  async getContractStatistics(dateRange?: { from: Date; to: Date }): Promise<any> {
    try {
      return await AggregationUtils.buildContractAnalysis(dateRange)
        .allowDiskUse(true)
        .maxTime(30000) // 30 seconds timeout
        .comment('ContractService.getContractStatistics - Contract analytics')
        .execute(this.contractModel);
    } catch (error) {
      console.error('Error in getContractStatistics:', error);
      throw new Error(`Failed to fetch contract statistics: ${error.message}`);
    }
  }

  /**
   * Get contracts by employee with pagination
   */
  @Cache({ ttl: 5 * 60 * 1000 }) // Cache for 5 minutes
  @Monitor({ logSlowQueries: true, threshold: 500 })
  async getContractsByEmployee(
    employeeId: string, 
    page: number = 1, 
    limit: number = 10
  ): Promise<{ contracts: Contract[]; total: number }> {
    try {
      const result = await AggregationBuilder.create()
        .match({ employee: new Types.ObjectId(employeeId) })
        .facet({
          contracts: [
            ...AggregationUtils.createPaginationStages(page, limit),
            AggregationUtils.createUserLookup('client', 'clientDetails', { name: 1, email: 1 }),
            {
              $project: {
                _id: 1,
                createdAt: 1,
                updatedAt: 1,
                status: 1,
                offerId: 1,
                clientDetails: { $arrayElemAt: ['$clientDetails', 0] }
              }
            }
          ],
          totalCount: [
            { $count: 'count' }
          ]
        })
        .comment('ContractService.getContractsByEmployee - Paginated employee contracts')
        .execute(this.contractModel);

      const contracts = result[0]?.contracts || [];
      const total = result[0]?.totalCount[0]?.count || 0;

      return { contracts, total };
    } catch (error) {
      console.error('Error in getContractsByEmployee:', error);
      throw new Error(`Failed to fetch contracts for employee ${employeeId}: ${error.message}`);
    }
  }

/*
  async findOne(email: string): Promise<User> {
    return await this.userModel.findOne({ email }, '-__v').exec();
  } */
}
