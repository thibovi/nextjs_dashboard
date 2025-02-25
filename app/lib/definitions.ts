export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  image_url: string | null;
};

export type Invoice = {
  id: string;
  name: string;
  email: string;
  image_url: string;
  amount: number;
  date: string;
  status: 'pending' | 'paid';
};


export type Revenue = {
  month: string;
  revenue: number;
};

export type LatestInvoice = {
  id: string;
  name: string;
  email: string;
  image_url: string | null;
  amount: string;
};

export type CardData = {
  numberOfInvoices: number;
  numberOfCustomers: number;
  totalPaidInvoices: string;
  totalPendingInvoices: string;
};
