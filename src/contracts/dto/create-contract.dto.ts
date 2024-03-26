export class CreateContractDto {
  
  readonly title: string;
  readonly content: string;
  readonly author: string;
  readonly startDate: string;
  readonly endDate:string;
  readonly status:string;
  readonly path?:string
  //readonly employeeId?:string;

}
