import { Prop, Schema } from "@nestjs/mongoose";
import mongoose , {HydratedDocument,Types} from "mongoose"
import { Design } from "./design";
import { ProjectStep } from "./project-step";
import { Contract } from "../../contracts/interface/contract";
import { Employee } from "../../users/interfaces/user";
import { ProjectWorker } from "./worker";
import { ProjectEarning} from "../../earnings/interface/earning";
//export type ProjectDocument = HydratedDocument<Project>
    
@Schema({
    toJSON:{
        versionKey: false,
    },
    toObject:{
        versionKey: false,
    }, timestamps:true
})
export class Project  {
  @Prop()
  _id: Types.ObjectId;
  @Prop()
  startDate:string;
  @Prop()
  endDate:string;
  @Prop()
  content:string;
  @Prop()
  status:string;

  @Prop({type:[{type:Types.ObjectId,ref:"ProjectEarning"}]})
  earnings?:ProjectEarning[]
    
  @Prop({type:mongoose.Schema.Types.ObjectId,ref:"User"})
  employee?:Employee;
  @Prop({type:[{type:mongoose.Schema.Types.ObjectId,ref:"designs"}]})
  designs?:Design[];
  @Prop({type:mongoose.Schema.Types.ObjectId,ref:"Contract"})
  contract?:Contract;
  @Prop({type:[{type:mongoose.Schema.Types.ObjectId,ref:"ProjectStep"}]})
  steps?:ProjectStep[];
  @Prop({type:[{type:mongoose.Schema.Types.ObjectId,ref:"ProjectWorker"}]})
  workers?:ProjectWorker[];

}
