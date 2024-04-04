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
   async createPage(payment:Payment){
    let client=payment.client
    let clientinfo=await client.toArrayP()
     
   }
}
