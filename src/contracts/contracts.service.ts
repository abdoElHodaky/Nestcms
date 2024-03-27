import { Injectable } from '@nestjs/common';
import { Model ,Types} from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateScheduleDto } from './dto/create-contract.dto';
import { Schedule } from './interface/contract.interface';
import { UsersService} from "../users/users.service"
@Injectable()
export class ContractService {
  constructor(@InjectModel('Contract') private readonly contractModel: Model<Contract>) {}
  private userService:UsersService
 
  async create(createContractDto: CreateContractDto): Promise<Contract> {
    const createdContract = new this.contractModel(createContractDto);
    //const client =await this.userService.find_Id(CreateContractDto.clientId)
    //const employee = await this.userService.find_Id(createScheduleDto.employeeId)
    
    return await createdContract.save();
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
