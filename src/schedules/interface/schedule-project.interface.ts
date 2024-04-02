import { Project } from "../projects/interface/project.interface";
import { ProjectStep } from "../projects/interface/project-step.interface";

export interface ScheduleProject{
 _id:string;
 title: string;
  content: string;
  author: string;
  startingDate: string;
  endingDate:string;
  status:string;
  project?:Project;
  projectSteps?:ProjectStep[]
  
}
