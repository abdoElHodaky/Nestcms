declare interface _Schedule {
  _id:string;
 title: string;
  content: string;
  author: string;
  creationDate: string;
  endingDate:string;
  status:string;
}
declare interface _ScheduleProject{
  _id:string;
 title: string;
  content: string;
  author: string;
  startingDate: string;
  endingDate:string;
  status:string;
}
export default _Schedule
export default _ScheduleProject
