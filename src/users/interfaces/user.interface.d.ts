export default interface User{
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
