import { Project } from "../../projects/interface/project";
import { ProjectStep } from "../../projects/interface/project-step";
import _ScheduleProject from"./schedule-project.d";
export class ScheduleProject implements _ScheduleProject {
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
