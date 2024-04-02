import { Employee ,Client } from "../../users/user";
import _Schedule from "./schedule.d"
export class Schedule implements _Schedule{
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
