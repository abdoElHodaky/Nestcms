export interface Offer {
  title: string;
  content: string;
  creationDate: string;
  endDate:string;
  status:string;
  price:string;
  contract?:{};
  client?:{};
  employee?:{};
}
