import { Client } from "../../users/interfaces/user";
import { Contract } from "../../contracts/interface/contract";
import _Payment from "./payment.d";
export class Payment implements _Payment {
  _id:string;
  title: string;
  content?: string;
  date: string;
  status:string;
  amount:string;
  currency:string
  contract?:Contract;
  client?:Client;

  toArrayP(){  
    return [this._id,this.amount,this.currency,this.content]
   }
  static toArrayP(arrp:Payment[]){
    let arr=arrp.map(p=>{
      let _p={_id,amount,currency,content}=p
      return _p
    })
    return arr
    
  }
}
