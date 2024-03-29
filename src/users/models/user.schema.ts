import * as mongoose from 'mongoose';

export const UserSchema = new mongoose.Schema({
  email: String,
  password: String,
  type:String,
  fullName:String,
  Age:Number,
  Addresse:String,
  isEmployee:Boolean,
  isAdmin:Boolean,
},{timestamps:true});
