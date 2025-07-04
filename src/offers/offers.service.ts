import { Injectable } from '@nestjs/common';
import { Model ,Types} from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateOfferDto } from './dto/create-offer.dto';
import { AcceptOfferDto } from './dto/accept-offer.dto';
import { OfferLinkToContractDto } from "./dto/link-contract.dto";
import { Offer } from './interface/offer.interface';
import { UsersService} from "../users/"
import { ContractService} from "../contracts/"
@Injectable()
export class OfferService {
  constructor(@InjectModel('Offer') private readonly offerModel: Model<Offer>) {}
  private userService:UsersService
  private contractService:ContractService
 
  async create(createOfferDto: CreateOfferDto): Promise<Offer> {
    const {employeeId,...rest}=createOfferDto
    const employee=await this.userService.find_Id(employeeId)
    const createdOffer = new this.offerModel({...rest});
    createdOffer.employee=employee
    return await createdOffer.save();
  }
  async accept(acceptOfferDto:AcceptOfferDto):Promise<Offer>{
    const {offerId,clientId,status}=acceptOfferDto
    const client = await this.userService.find_Id(clientId)
    const offer= await this.offerModel.findById(offerId).exec()
    offer.status=status
    offer.client=client
    return await offer.save()
  }
  async employee_all(uid:string):Promise<Offer[]>{
    const employee = await this.userService.find_Id(uid)
    return await this.offerModel.find().populate({
      path:"employee",
      match:{"employee._id":employee?._id},
    }).exec();
  }
  async find_Id(_id:string):Promise<Offer>{
    return await this.offerModel.findById(_id).exec()
  }
  async LinkContract(offerLinkToContractDto:OfferLinkToContractDto):Promise<Offer>{
    const {offerId,contractId}=offerLinkToContractDto
    const offer=await this.offerModel.findById(offerId)
    const contract=await this.contractService.find_Id(contractId)
    offer.contractId=contract?._id
    return await offer.save()
  }
/*
  async findOne(email: string): Promise<User> {
    return await this.userModel.findOne({ email }, '-__v').exec();
  } */
}
