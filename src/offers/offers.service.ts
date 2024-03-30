import { Injectable } from '@nestjs/common';
import { Model ,Types} from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateOfferDto } from './dto/create-offer.dto';
import { AcceptOfferDto } from './dto/accept-offer.dto';

import { Offer } from './interface/offer.interface';
import { UsersService} from "../users/users.service"
import { ContractService} from "../contracts/contracts.service"
@Injectable()
export class OfferService {
  constructor(@InjectModel('Offer') private readonly offerModel: Model<Offer>) {}
  private userService:UsersService
 
  async create(createOfferDto: CreateOfferDto): Promise<Offer> {
    const {employeeId,...rest}=CreateOfferDto
    const employee=await this.userService.find_Id(employeeId)
    const createdOffer = new this.offerModel(rest);
    createdOffer.employee=employee
    return await createdOffer.save();
  }
  async accept(acceptOfferDto:AcceptOfferDto):Promise<Offer>{
    const {offerId,clientId}=acceptOfferDto
    const client = await this.userService.find_Id(clientId)
    const offer= this.offerModel.findById(offerId).exec()
    offer.status=acceptOfferDto.status
    offer.client=client
    return await offer.save()
  }
  async all(uid:string):Promise<Offer[]>{
    const employee = await this.userService.find_Id(uid)
    return this.offerModel.find().populate({
      path:"employee",
      match:{"employee._id":employee._id},
    }).exec();
  }
  async find_Id(_id:string):Promise<Offer>{
    return await this.offerModel.findById(_id).exec()
  }
/*
  async findOne(email: string): Promise<User> {
    return await this.userModel.findOne({ email }, '-__v').exec();
  } */
}
