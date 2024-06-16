import { Controller, Get, UseGuards, Post, Request,Response,Res } from '@nestjs/common';
@Controller('')
export class AppController {
  constructor() {}
  @Get("")
  async index(@Res() res:Response ){   
    res.redirected("docs")
 
   }
}
