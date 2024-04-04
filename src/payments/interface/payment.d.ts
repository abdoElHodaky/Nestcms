declare interface _Payment {
  _id:string;
  title: string;
  content?: string;
  date: string;
  status:string;
  amount:string;
  currency:string
}
export default _Payment
