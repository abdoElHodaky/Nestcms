const paytabs = require('paytabs_pt2');
class PayTabsService{
   
   async config(profile:string,serverk:string,region:string):Promise<any>
    {
      await paytabs.config(profile,serverK,region)
    }
}
