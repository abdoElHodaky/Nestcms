import { Project } from "./project.interface";
import _ProjectDesign from "project-design.d";
export class Design implements _ProjectDesign {
  _id:string;
  desc:string;
  path:string;
  created_at?:string;
  updated_at?:string;
  project?:Project;
}
