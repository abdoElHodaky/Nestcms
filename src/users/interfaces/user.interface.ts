import _User from "./user.d";
export class User implements _User {
  _id: string;
  email: string;
  password: string;
  fullName:string;
  username:string;
  Address:string;
  phone:string;
  isEmployee?:boolean
  employeeType?:string
  isAdmin?:boolean;
  adminType?:string
  schedules?:[]
  projects?:[]
}

export class Employee implements _User {
  isEmployee:boolean=true;
  employeeType:string;
}

export class Client implements _User {
  isEmployee:boolean=false;
  isAdmin:boolean=false;
}

export class Admin implements _User {
  isAdmin:boolean=true;
  adminType:string;
}
