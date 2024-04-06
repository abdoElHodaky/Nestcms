import { Admin , User } from "../users/interfaces/user";
export interface Permission {
  _id:string;
  type:string;
  status:string
  _by:Admin
  _for:User
  onId:string;
  onModel:string

}
  
