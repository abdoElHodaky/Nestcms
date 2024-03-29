export interface User {
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

export class Employee extends User {
  isEmployee:boolean=true;
  employeeType:string;
}

export class Client extends User {
  isEmployee:boolean=false;
  isAdmin:boolean=false;
}

export class Admin extends User {
  isAdmin:boolean=true;
  adminType:string;
}
