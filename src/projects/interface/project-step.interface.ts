import { Project } from "./project.interface";
//import { Contract } from "../contracts/contract.interface";
import _ProjectStep from "./project-step.d";
export class ProjectStep implements _ProjectStep {
  _id: string;
  startDate:string;
  endDate:string;
  content:string;
  status:string;
  project?:Project
}
