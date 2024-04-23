import { Controller, Post, Body, Get, Delete, Param, UseInterceptors, Put,UseGuards,Request ,Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PermGuard } from "../perm.guard";
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Permission , OnModel } from '../permissions/permissions-models.enum';
import { PaymentLinkToContractDto } from "./dto/link-contract.dto";
import { PaymentService } from './payments.service';
import { ApiTags,ApiSecurity,ApiBearerAuth,ApiExcludeEndpoint,ApiOperation } from "@nestjs/swagger";
//import { CurrentUserInterceptor } from '../currentuser.interceptor';
//import { UpdateArticleDto } from './dto/update-article.dto';
//@UseInterceptors(CurrentUserInterceptor)
//@ApiBearerAuth('JWTAuthorization')
@ApiTags("Payment")
//@UseGuards(AuthGuard('jwt'))
@Controller(["api/payments"])
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}
 
  @ApiBearerAuth('JWTAuthorization')
  @UseGuards(AuthGuard('jwt'))
  @Get()
  @ApiOperation({description:"get all payments"})
  async All() {
    return this.paymentService.All();
  }

  
  @ApiBearerAuth('JWTAuthorization')
  @UseGuards(AuthGuard('jwt'))
  @Post("create")
  @ApiOperation({description:"create payment"})
  async create(@Body() createPaymentDto: CreatePaymentDto) {
    return await this.paymentService.create(createPaymentDto);
  }
  
  @ApiBearerAuth('JWTAuthorization')
  @UseGuards(AuthGuard('jwt'))
  @Get("pay/:id")
  @ApiOperation({description:"Process payment"})
  async pay(@Param("id") paymentId:string,@Request() req){
    const url =`${req.baseUrl}/pay`
    return await this.paymentService.Pay(paymentId,{callback:url+"/callback",return:url+"/return"});
  }
  
  //@Res({passthrough:true})
  @Post("pay/callback")
  @ApiOperation({description:"callback for payments"})
  async payCallback(@Request() req:Request){
    let res=await this.paymentService.payCallback(req.body)
    let rp=await this.paymentService.verify(res.transR,res.paymentId)
    /*let {respCode,respMessage,transRef,respStatus} =res
    return {
      trans:transRef,
      status:respStatus,
      code:respCode,
      message:respMessage,
    }*/
     return rp

  }
  
  //@Res({passthrough:true})
  @Post("pay/return")
  @ApiOperation({description:"return of payments"})
  async payReturn(@Request() req:Request){
    
    let res=await this.paymentService.payCallback(req.body)
    let rp=await this.paymentService.verify(res.transR,res.paymentId)
    /*let {respCode,respMessage,transRef,respStatus} =res
    return {
      trans:transRef,
      status:respStatus,
      code:respCode,
      message:respMessage,
    }*/
     return rp
    }

  @ApiBearerAuth('JWTAuthorization')
  @Permissions({perms:[Perms.Read],models:[OnModel.PAYMENT]})
  @UseGuards(AuthGuard('jwt'),PermGuard)
  @Get("/:userId")
  async ofUser(@Param("userId") userId:string){
    return userId
  }

  


  /*
  @Get("employee")
  async employee_all(@Request() req){
    return await this.offerService.employee_all(req.user.id);
  }
  @Post("accept")
  async employee_accept(@Body() acceptOfferDto:AcceptOfferDto){
    return await this.offerService.accept(acceptOfferDto)
  }*/
  /*@Post("linkcontract")
  async linkContract(@Body() paymentLinkToContractDto: PaymentLinkToContractDto){
    return await this.paymentService.LinkContract(paymentLinkToContractDto);
  }


  @Get()
  async findAll() {
    return this.articlesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.articlesService.findOne(id);
  }

  @Delete(':id')
  async deleteArticle(@Param('id') id: string) {
    // tslint:disable-next-line: no-console
    console.log('delete article with id -> ', id);
    return this.articlesService.delete(id);
  }*/
}
