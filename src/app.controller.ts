import { Controller, Get, UseGuards, Post, 
        Request,Res ,Redirect,UseGuards} from '@nestjs/common';
//import { Response} from "express";
import {OptionalJwtAuthGuard} from "perm.guard";
@UseGuards(OptionalJwtAuthGuard)
        
@Controller()
export class AppController {
  constructor() {}
  
  @Redirect("/docs")
  
  @Get("")
  async index(@Res() res:Response ){   
    
    
   }
}
