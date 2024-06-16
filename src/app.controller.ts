import { Controller, Get, UseGuards, Post, Request,Response,Res } from '@nestjs/common';
@Controller('')
export class AppController {
  constructor() {}
  @Get()
  async redirect(@Res() res:Response ){   
    res.redirect("/docs")
 
   }
}
