import { ApiHideProperty } from "@nestjs/swagger";

export class Address {
   
  //  @ApiHideProperty()
    title: string;

   // @ApiHideProperty()
    street: string;
    
   // @ApiHideProperty()
    city: string;

   // @ApiHideProperty()
    state: string;
   
  //  @ApiHideProperty()
    country: string;
  
}
