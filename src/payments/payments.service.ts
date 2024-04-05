import { Injectable } from '@nestjs/common';
import { Model ,Types} from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreatePaymentDto } from './dto/create-payment.dto';
//import { AcceptOfferDto } from './dto/accept-offer.dto';
import { PaymentLinkToContractDto } from "./dto/link-contract.dto";
import { Payment } from './interface/payment.interface';
import { UsersService} from "../users/users.service"
import { ContractService} from "../contracts/contracts.service"
import { PayTabService } from "../paytabs.service";
@Injectable()
export class PaymentService {
  constructor(@InjectModel('Payment') private readonly paymModel: Model<Payment>) {}
  private userService:UsersService
  private contractService:ContractService
  private payTabService:PayTabService
   async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const {contractId,...rest}=createPaymentDto
    let linkcontract:PaymentLinkToContractDto
    const contract=await this.contractService.find_Id(contractId)
    const createdPayment = new this.paymModel(rest);
    createdPayment.client=contract.client
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
  async All(): Promise<Payment[]>{
    return await this.paymModel.find().exec()
  }
  async LinkContract(paymentLinkToContractDto:PaymentLinkToContractDto):Promise<Payment>{
    const {paymentId,contractId}=paymentLinkToContractDto
    const payment=await this.paymModel.findById(paymentId)
    const contract=await this.contractService.find_Id(contractId)
    payment.contract=contract
    return await payment.save()
  }
  async Pay(paymentId:string,urls:any):Promise<any>{
     let payment=await this.find_Id(paymentId)
    return await this.payTabService.createPage(payment,urls)
  }
/*
  async findOne(email: string): Promise<User> {
    return await this.userModel.findOne({ email }, '-__v').exec();
  } */
}
