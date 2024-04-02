import _Contract from "./contract.d";
export class Contract implements _Contract{
  title: string;
  content: string;
  author: string;
  creationDate: string;
  status:string;
  path:string;
  offer?:{};
  client?:{};
  employee?:{};

}
