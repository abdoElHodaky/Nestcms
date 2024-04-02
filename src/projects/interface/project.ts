import { Design } from "./design";
import { ProjectStep } from "./project-step";
import { Contract } from "../../contracts/interface/contract";
import { Employee } from "../../users/interfaces/user";
import _Project from "./project.d"
export class Project implements _Project {
  _id: string;
  startDate:string;
  endDate:string;
  content:string;
  status:string;
  employee?:Employee;
  designs?:Design[];
  contract?:Contract;
  steps?:ProjectStep[];
}
