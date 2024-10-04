import { Injectable } from '@nestjs/common';
import { Model ,Types} from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreatePaymentDto,  PaymentLinkToContractDto } from './dto/';
//import { PaymentLinkToContractDto } from "./dto/link-contract.dto";
import { Payment } from './interface/payment.interface';
import { UsersService} from "../users/"
import { ContractService} from "../contracts/"
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
    payment.contractId=contract._id
    return await payment.save()
  }
  async Pay(paymentId:string,urls:{callback:string,return:string}):Promise<any>{
     let payment=await this.find_Id(paymentId)
    return await this.payTabService.createPage(payment,urls)
  }

  async verify(transR:string,paymentId:string):Promise<any>{
    let res= await this.payTabService.payVerify(transR)
    let { valid,code }=res
    if (valid===true){
      let payment=await this.paymModel.findById(paymentId)
      payment.status="paid"
      payment.transR=transR
      await payment.save()
      return {message:"Payment success , Thanks"}

    }
    else{
      return res
    }
    
  }

  async payCallback(result:any):Promise<any>{
    return await this.payTabService.payCallback(result)
  }

  async ofUser(userId:string):Promise<Payment[]>{
    return await this.paymModel.find().where({
      client:new Types.ObjectId(userId)
    }).exec()
  }
/*
  async findOne(email: string): Promise<User> {
    return await this.userModel.findOne({ email }, '-__v').exec();
  } */
}
