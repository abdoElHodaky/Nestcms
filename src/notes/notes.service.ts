import { Injectable } from '@nestjs/common';
import { Model ,Types} from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateNoteDto } from './dto/create-note.dto';
//import { AcceptOfferDto } from './dto/accept-offer.dto';
//import { OfferLinkToContractDto } from "./dto/link-contract.dto";
import { Note } from './interface/note.interface';
import { UsersService} from "../users/users.service"
import { ContractService} from "../contracts/contracts.service"
@Injectable()
export class NoteService {
  constructor(@InjectModel('Note') private readonly noteModel: Model<Note>) {}
  private userService:UsersService
  private contractService:ContractService
 
  async create(createNoteDto: CreateNoteDto): Promise<Note> {
    const {authorId,...rest}=createNoteDto
    const author=await this.userService.find_Id(authorId)
    const createdNote = new this.noteModel({_id:new Types.ObjectId(),...rest});
    createdNote.author=author
    return await createdNote.save();
  }
  
/*  async employee_all(uid:string):Promise<Offer[]>{
    const employee = await this.userService.find_Id(uid)
    return await this.offerModel.find().populate({
      path:"employee",
      match:{"employee._id":employee._id},
    }).exec();
  }*/
  async find_Id(_id:string):Promise<Note>{
    return await this.noteModel.findById(_id).exec()
  }
  /*
  async findOne(email: string): Promise<User> {
    return await this.userModel.findOne({ email }, '-__v').exec();
  } */
}
