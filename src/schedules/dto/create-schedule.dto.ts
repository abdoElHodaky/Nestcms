export class CreateScheduleDto {
  
  readonly title: string;
  readonly content: string;
  readonly startDate: string;
  readonly endDate:string;
  readonly employeeId?:string;
  readonly clientId?:string
}
