import { User } from "../../users/interfaces/user";
export interface Note {
  _id:string;
  status:string;
  onId:string;
  onType:string;
  author?:User
}
