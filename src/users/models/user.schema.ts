import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";

/*export const UserSchema = new mongoose.Schema({
  email: String,
  password: String,
  username:String,
  fullName:String,
  Age:Number,
  Addresse:String,
  phone:String,
  isEmployee:Boolean,
  isAdmin:Boolean,
  employeeType:String,
  adminType:String
},{timestamps:true});*/

export type UserDocument = HydratedDocument<User>

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
    isEmployee:boolean
    @Prop()
    isAdmin:boolean
    @Prop()
    employeeType:string
    @Prop()
    adminType:string
    
   

    //Add one to many relation to InvoiceSchema
    /*@Prop({type:[
        {type : mongoose.Types.ObjectId , ref: 'Invoice'}
    ]})
    obj_invoices: [Invoice]*/
}

export const UserSchema = SchemaFactory.createForClass(User);
