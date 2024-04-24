import { Prop, Schema } from "@nestjs/mongoose";

//import _User from "./user.d";
/*export class User implements _User {
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
}*/


@Schema({
    toJSON:{
        versionKey: false,
    },
    toObject:{
        versionKey: false,
    }
})
export class User{
  
    @Prop()
    _id:string
    @Prop()
    fullName: string
    @Prop({unique:true})
    username:string
    @Prop({unique: true})
    phone: string
    @Prop()
    email:string
    @Prop()
    password:string
    @Prop()
    Age:number
    @Prop()
    Address:string
    @Prop()
    isEmployee?:boolean
    @Prop()
    isAdmin?:boolean
    @Prop()
    employeeType?:string
    @Prop()
    adminType?:string
    
   
   toArrayP(){
    return [
      this.fullName,
      this.email,
      this.phone,
      this.Address,
      "","","","",""
    ];
  }
    //Add one to many relation to InvoiceSchema
    /*@Prop({type:[
        {type : mongoose.Types.ObjectId , ref: 'Invoice'}
    ]})
    obj_invoices: [Invoice]*/
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
