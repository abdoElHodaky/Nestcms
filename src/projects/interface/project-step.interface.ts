import { Project } from "./project.interface";
//import { Contract } from "../contracts/contract.interface";
export interface ProjectStep {
  _id: string;
  startDate:string;
  endDate:string;
  content:string;
  status:string;
  project?:Project
}
