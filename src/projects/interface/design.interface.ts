import { Project } from "./project.interface";
import _Design from "project-design";
export class Design implements _Design {
  _id:string;
  desc:string;
  path:string;
  created_at?:string;
  updated_at?:string;
  project?:Project;
}
