import { Design } from "./design.interface";
import { ProjectStep } from "./interface/project-step.interface";
import { Contract } from "../contracts/contract.interface";
export interface Project {
  _id: string;
  startDate:string;
  endDate:string;
  content:string;
  status:string;
  employee?:{};
  designs?:Design[];
  contract?:Contract;
  steps:ProjectStep[];
}
