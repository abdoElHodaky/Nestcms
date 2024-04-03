import { Injectable } from '@nestjs/common';
import { Model ,Types} from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreatePaymentDto } from './dto/create-offer.dto';
//import { AcceptOfferDto } from './dto/accept-offer.dto';
import { PaymentLinkToContractDto } from "./dto/link-contract.dto";
import { Payment } from './interface/payment.interface';
import { UsersService} from "../users/users.service"
import { ContractService} from "../contracts/contracts.service"
@Injectable()
export class PaymentService {
  constructor(@InjectModel('Payment') private readonly paymModel: Model<Payment>) {}
  private userService:UsersService
  private contractService:ContractService
 
   async create(createPaymentDto: CreatePaymentDto): Promise<Offer> {
    const {clientId,contractId,...rest}=createPaymentDto
    const linkcontract:PaymentLinkToContractDto
    const client=await this.userService.find_Id(clientId)
    const createdPayment = new this.paymModel(rest);
    createdPayment.client=client
    await createdPayment.save();
    linkcontract={paymentId:createdPayment._id,contractId:contractId}
    return await this.LinkContract(linkcontract)
  }/*
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
      match:{"employee._id":employee._id},
    }).exec();
  }*/
  async find_Id(_id:string):Promise<Payment>{
    return await this.paymModel.findById(_id).exec()
  }
  async LinkContract(paymentLinkToContractDto:PaymentLinkToContractDto):Promise<Payment>{
    const {offerId,contractId}=paymentLinkToContractDto
    const payment=await this.paymModel.findById(offerId)
    const contract=await this.contractService.find_Id(contractId)
    payment.contract=contract
    return await payment.save()
  }
/*
  async findOne(email: string): Promise<User> {
    return await this.userModel.findOne({ email }, '-__v').exec();
  } */
}
