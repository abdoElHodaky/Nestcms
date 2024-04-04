import { Injectable } from '@nestjs/common';
import paytabs from "paytabs_pt2";
import { Client } from "./users/interfaces/user";
@Injectable()
class PayTabsService{
  async values(obj){
      return obj.values()
   }
   async config(profile:string,serverk:string,region:string):Promise<any>
    {
      await paytabs.config(profile,serverk,region)
    }
   async createPage(){}
}
