export interface User {
  _id: string;
  email: string;
  password: string;
  fullName:string;
  Address:string;
  type:string;
  isEmployee?:boolean
  employeeType?:string
  isAdmin?:boolean;
  adminType?:string
  schedules?:[]
  projects?:[]
}
