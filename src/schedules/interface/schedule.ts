import { Employee ,Client } from "../users/user";
export interface Schedule{
 _id:string;
 title: string;
  content: string;
  author: string;
  creationDate: string;
  endingDate:string;
  status:string;
  client?:Client;
  employee?:Employee;
}