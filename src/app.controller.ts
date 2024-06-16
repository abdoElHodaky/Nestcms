import { Controller, Get, UseGuards, Post, 
        Request,Res ,Redirect} from '@nestjs/common';
import { Response} from "express";
@Controller('/')
export class AppController {
  constructor() {}
  
  @Redirect("/docs")
  @Get("")
  async index(@Res() res:Response ){   
    res.redirect("docs")
    
   }
}
