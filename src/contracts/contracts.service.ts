import { Injectable } from '@nestjs/common';
import { Model ,Types} from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateContractDto } from './dto/create-contract.dto';
import { Contract } from './interface/contract.interface';
import { Offer } from './interface/offer.interface';
import { UsersService} from "../users/users.service"
import { OfferService} from "../offers/offers.service"
@Injectable()
export class ContractService {
  constructor(@InjectModel('Contract') private readonly contractModel: Model<Contract>) {}
  private userService:UsersService
  private offerService:OfferService
 
  async create(createContractDto: CreateContractDto): Promise<Contract> {
    const {clientId,employeeId,...rest}=createContractDto
    const [client,employee]=await this.userService.findMany_Id([clientId,employeeId])
    const createdContract = new this.contractModel(rest);
    createdContract.client=client
    createdContract.employee=employee
    //const client =await this.userService.find_Id(CreateContractDto.clientId)
    //const employee = await this.userService.find_Id(createScheduleDto.employeeId)
    
    return await createdContract.save();
  }
  async createFrom_Offer(offerId:string):Promise<Contract | Offer>{
    const offer = await this.offerService.find_Id(offerId)
    if(offer.status="Accept_Client"){
    const createdContract = new this.contractModel();
    createdContract.offer=offer
    createdContract.client=offer.client
    createdContract.employee=offer.employee
    return await createdContract.save()}
    else{
      return offer
    }
  
  }
  async all(uid:string):Promise<Contract[]>{
    const employee = await this.userService.find_Id(uid)
    return this.contractModel.find().populate({
      path:"employee",
      match:{"employee._id":employee._id},
    }).exec();
  }
/*
  async findOne(email: string): Promise<User> {
    return await this.userModel.findOne({ email }, '-__v').exec();
  } */
}
