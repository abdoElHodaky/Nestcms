import * as mongoose from 'mongoose';

export const UserSchema = new mongoose.Schema({
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
},{timestamps:true});
