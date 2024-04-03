import _Contract from "./contract.d";
import { Client, Employee } from "../../users/interfaces/user";
import { Offer } from "../../offers/interface/offer.interface";

export class Contract implements _Contract{
  _id:string;
  title: string;
  content: string;
  author: string;
  creationDate: string;
  status:string;
  path:string;
  offer?:Offer;
  client?:Client;
  employee?:Employee;

}
