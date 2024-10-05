import { Prop, Schema } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { Address} from "../../address/interface/address";
/*
export type UserDocument = HydratedDocument<User>
export type ClientDocument = HydratedDocument<Client>
export type EmployeeDocument = HydratedDocument<Employee>
export type AdminDocument = HydratedDocument<Admin>
*/
@Schema({
    toJSON:{
        versionKey: false,
    },
    toObject:{
        versionKey: false,
    }, timestamps:true
})
export class User{
  
    @Prop()
    id:string
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
    @Prop({type:Object})
    address:Address
    
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
      Object.values(this.address),
      "","","","",""
    ];
  }
    //Add one to many relation to InvoiceSchema
    /*@Prop({type:[
        {type : mongoose.Types.ObjectId , ref: 'Invoice'}
    ]})
    obj_invoices: [Invoice]*/
}

@Schema({
    toJSON:{
        versionKey: false,
    },
    toObject:{
        versionKey: false,
    }
})
export class Employee extends User {
  @Prop()
  isEmployee?:boolean=true;
  @Prop()
  employeeType?:string;
}

@Schema({
    toJSON:{
        versionKey: false,
    },
    toObject:{
        versionKey: false,
    }
})
export class Client extends User {
  @Prop()
  readonly isEmployee?:boolean=false
  @Prop()
  readonly isAdmin?:boolean=false
  @Prop()
  readonly employeeType?:string=""
  @Prop()
  readonly adminType?:string=""
}

@Schema({
    toJSON:{
        versionKey: false,
    },
    toObject:{
        versionKey: false,
    }
})
export class Admin extends User {
  @Prop()
  isAdmin?:boolean=true;
  @Prop()
  adminType?:string;
}
