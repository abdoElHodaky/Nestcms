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

  toArrayP(){
    return [
      this.fullName,
      this.email,
      this.phone,
      this.Address,
      "","","","",""
    ];
  }
}

export class Employee extends User {
  isEmployee?:boolean=true;
  employeeType?:string;
}

export class Client extends User {
  readonly isEmployee?:boolean=false
  readonly isAdmin?:boolean=false
  readonly employeeType?:string=""
  readonly adminType?:string=""
}

export class Admin extends User {
  isAdmin?:boolean=true;
  adminType?:string;
}
