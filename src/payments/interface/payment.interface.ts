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

  toArray(){}
}
