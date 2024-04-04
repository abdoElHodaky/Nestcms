import { Injectable } from '@nestjs/common';
import paytabs from "paytabs_pt2";
@Injectable()
class PayTabsService{
   
   async config(profile:string,serverk:string,region:string):Promise<any>
    {
      await paytabs.config(profile,serverK,region)
    }
}
