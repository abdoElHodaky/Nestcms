import { Controller, Get, Post, 
        Request,Res ,Redirect,UseGuards} from '@nestjs/common';
//import { Response} from "express";
//import {OptionalJwtAuthGuard} from "./perm.guard";
import { ApiExcludeController } from "@nestjs/swagger";

//@UseGuards(OptionalJwtAuthGuard)
@ApiExcludeController()
@Controller()
export class AppController {
  constructor() {}
  
  @Redirect("/docs")
  @Get("")
  async index(@Res() res:Response ){   
      }

  @Redirect("/docs/projects")     
  @Get("projects")
  async projects(@Res() res:Response){}
        
}
