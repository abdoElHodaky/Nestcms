import { Project } from "./project.interface";
export interface Design {
  _id:string;
  desc:string;
  path:string;
  created_at?:string;
  updated_at?:string;
  project?:Project;
}
