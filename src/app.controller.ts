import { Controller, Get, UseGuards, Post, 
        Request,Response,Res ,Redirect} from '@nestjs/common';
@Controller('')
export class AppController {
  constructor() {}
  
  @Redirect("docs")
  @Get()
  async redirect(@Res() res:Response ){   
    return "docs"
   }
}
