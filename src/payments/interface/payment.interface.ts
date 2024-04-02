export interface Payment {
  title: string;
  content?: string;
  date: string;
  status:string;
  amount:string;
  currency:string
  contract?:{};
  client?:{};
}
