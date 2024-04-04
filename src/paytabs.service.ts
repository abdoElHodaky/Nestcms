import { Injectable } from '@nestjs/common';
import paytabs from "paytabs_pt2";
import { Client } from "./users/interfaces/user";
import { Payment } from "./payments/interface/payment.interface";
@Injectable()
class PayTabsService{
  async values(obj){
      let arr=[]
      for(var i in obj){
        arr.push(obj[i])
      }
    return arr;
   }
   async config(profile:string,serverk:string,region:string):Promise<any>
    {
      await paytabs.config(profile,serverk,region)
    }
   async createPage(payment:Payment,urls:{}):Promise<any>{
    let res={};
    let client=payment.client
    let clientinfo=await client.toArrayP()
    let paymentinfo=await payment.toArrayP()
    let urls=[urls.callback,urls.return]
    await paytabs.createPaymentPage(['all'],['sale','ecom'],paymentinfo,
    clientinfo,clientinfo,
    "AR",urls,(result)=>{
       res=result
     })
     return  result.redirect_url
     
   }
  async payPageCallback(){}
  async payPageReturn(){}
}
