import { Design } from "./design.interface";
export interface Project {
  _id: string;
  startDate:string;
  endDate:string;
  content:string;
  status:string;
  employeeId:string;
  designs?:Design[]
}
