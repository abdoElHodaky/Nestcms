import { Injectable } from '@nestjs/common';
import { Model ,Types} from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateContractDto } from './dto/create-contract.dto';
import { Contract } from './interface/contract.interface';
import { Offer } from '../offers/interface/offer.interface';
import { UsersService} from "../users/users.service"
import { OfferService} from "../offers/offers.service"
@Injectable()
export class ContractService {
  constructor(@InjectModel('Contract') private readonly contractModel: Model<Contract>) {}
  private userService:UsersService
  private offerService:OfferService
 
  async create(createContractDto: CreateContractDto): Promise<Contract> {
    const {clientId,employeeId,offerId,...rest}=createContractDto
    const [client,employee]=await this.userService.findMany_Id([clientId,employeeId])
    const createdContract = new this.contractModel(rest);
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
    createdContract.offer=offer
    createdContract.client=offer.client
    createdContract.employee=offer.employee
    return await createdContract.save()}
    else{
      return contract
    }
  
  }
  async employee_all(uid:string):Promise<Contract[]>{
    const employee = await this.userService.find_Id(uid)
    return await this.contractModel.find().populate({
      path:"employee",
      match:{"employee._id":employee._id},
    }).exec();
  }
  async find_Id(_id:string):Promise<Contract>{
    return await this.contractModel.findById(_id).exec()
  }
/*
  async findOne(email: string): Promise<User> {
    return await this.userModel.findOne({ email }, '-__v').exec();
  } */
}
