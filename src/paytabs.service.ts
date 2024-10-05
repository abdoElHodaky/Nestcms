import { Injectable } from '@nestjs/common';
import paytabs from "paytabs_pt2";
import { Client } from "./users/interfaces/user";
import { Payment } from "./payments/interface/payment.interface";
import { ContractService} from "./contracts/"
@Injectable()
export class PayTabService{
  private contractS:ContractService;
  async values(obj){
      let arr=[]
      for(var i in obj){
        arr.push(obj[i])
      }
    return arr;
   }
   async start():Promise<any>
    {
      const {PAYTABS_PROFILE,PAYTABS_SERVERK,PAYTABS_REGION}=process.env
      await paytabs.setConfig(PAYTABS_PROFILE,PAYTABS_SERVERK,PAYTABS_REGION)
    }
   async createPage(payment:Payment,urls:any):Promise<any>{
    let res;
    let client=payment.client
    let contract=await this.contractS.find_Id(payment.contractId.toString())
    let shippinginfo=await contract.employee.toArrayP()
    let clientinfo=await client.toArrayP()
    let paymentinfo=await payment.toArrayP()
    let _urls=[urls.callback,urls.return]
    await paytabs.createPaymentPage(['all'],['sale','ecom'],paymentinfo,
    clientinfo,shippinginfo,
    "AR",_urls,(result)=>{
       res=result
     })
     return  res.redirect_url
     
   }
  async payCallback(result:any):Promise<any> {
    let {respCode,respMessage,transRef,respStatus,cart} =result
    return {
      trans:transRef,
      status:respStatus,
      code:respCode,
      message:respMessage,
      paymentId:cart.cart_id
    }
  }
  async payReturn(result:any):Promise<any>{
    let {respCode,respMessage,transRef,respStatus,cart} =result
    return {
      trans:transRef,
      status:respStatus,
      code:respCode,
      message:respMessage,
      paymentId:cart.cart_id
    }
  }
  async payVerify(transR:string){
    let valid=false;
    let res;
    paytabs.validatePayment(transR,result=>{
      if (result['response_code:'] === 400)
    {
        valid=false
    }
    else
    {
        valid=true;
    }
         res=result
    });
    return {transRef:transR,code:res['response_code:'],valid:valid}
  }
  
}
