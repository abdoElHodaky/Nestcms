import { Client,Employee } from "../../users/interfaces/user";
import { Contract } from "../../contracts/interface/contract";
export interface Offer {
  title: string;
  content: string;
  creationDate: string;
  endDate:string;
  status:string;
  price:string;
  contract?:Contract;
  client?:Client;
  employee?:Employee;
}
