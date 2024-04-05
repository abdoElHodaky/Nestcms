import { Controller, Post, Body, Get, Delete, Param, UseInterceptors, Put,UseGuards,Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreatePaymentDto } from './dto/create-payment.dto';
//import { AcceptOfferDto } from './dto/accept-offer.dto';
import { PaymentLinkToContractDto } from "./dto/link-contract.dto";
import { PaymentService } from './payments.service';
import { ApiTags,ApiSecurity,ApiBearerAuth,ApiExcludeEndpoint } from "@nestjs/swagger";
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
  async All() {
    return this.paymentService.All();
  }
  @ApiBearerAuth('JWTAuthorization')
  @UseGuards(AuthGuard('jwt'))
  @Post("create")
  async create(@Body() createPaymentDto: CreatePaymentDto) {
    return await this.paymentService.create(createPaymentDto);
  }
  
  @Post("pay/:id")
  async pay(@Param("id") paymentId:string,@Request() req){
    const url =`${req.baseUrl}${req.path}`
    return await this.paymentService.Pay(paymentId,{callback:url+"/callback",return:url+"/return"});
  }
  
  @Post("pay/callback")
  async payCallback(@Request() req){
    return req.body
  }
  
  
  @Post("pay/return")
  async payReturn(@Request() req){
    return req.body
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
