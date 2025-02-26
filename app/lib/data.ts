import { createClient } from '@supabase/supabase-js';
import {
  Customer,
  Invoice,
  LatestInvoice,
  Revenue,
  CardData
} from './definitions';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

const FALLBACK_IMAGE = '/images/fallback-avatar.png';

export async function fetchRevenue(): Promise<Revenue[]> {
  const { data, error } = await supabase.from('revenue').select('month, revenue');
  if (error) throw error;
  return data;
}

export async function fetchLatestInvoices() {
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      id,
      amount,
      customers:customer_id (name, email, image_url)
    `)
    .order('date', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching latest invoices:', error);
    return [];
  }

  return data.map((invoice: any) => ({
    id: invoice.id,
    name: invoice.customers?.[0]?.name || 'Unknown',
    email: invoice.customers?.[0]?.email || 'No email',
    image_url: invoice.customers?.image_url || '/images/fallback-avatar.png',
    amount: invoice.amount.toString(),
  }));
}


export async function fetchCardData(): Promise<CardData> {
  const [invoiceCount, customerCount, invoiceStatus] = await Promise.all([
    supabase.from('invoices').select('*', { count: 'exact', head: true }),
    supabase.from('customers').select('*', { count: 'exact', head: true }),
    supabase.rpc('get_invoice_stats'),  // ✅ Gebruik .rpc() om de function aan te roepen
  ]);

  if (invoiceCount.error || customerCount.error || invoiceStatus.error) {
    console.error('Error fetching card data:', {
      invoiceCount: invoiceCount.error,
      customerCount: customerCount.error,
      invoiceStatus: invoiceStatus.error,
    });
    throw new Error('Failed to fetch card data.');
  }

  // ✅ Verwerk de data zonder rode lijnen
  const stats = invoiceStatus.data?.[0] || {};
  return {
    numberOfInvoices: invoiceCount.count || 0,
    numberOfCustomers: customerCount.count || 0,
    totalPaidInvoices: String(stats.paid ?? 0),
    totalPendingInvoices: String(stats.pending ?? 0),
  };
}


export async function fetchFilteredInvoices(query: string, currentPage: number) {
  const ITEMS_PER_PAGE = 10;
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  // ✅ Gebruik een query builder zonder `.or()`
  let queryBuilder = supabase
    .from('invoices')
    .select(
      `
      id,
      amount,
      date,
      status,
      customers!inner(id, name, email, image_url)
    `
    )
    .order('date', { ascending: false })
    .range(offset, offset + ITEMS_PER_PAGE - 1);

  // ✅ Voeg correcte filter toe zonder `.or()`
  if (query.trim()) {
    queryBuilder = queryBuilder.ilike('customers.name', `%${query}%`);
    queryBuilder = queryBuilder.ilike('customers.email', `%${query}%`);
  }

  const { data, error } = await queryBuilder;

  if (error) {
    console.error('Error fetching filtered invoices:', error);
    return [];
  }

  return data.map((invoice: any) => ({
    id: invoice.id,
    name: invoice.customers?.name || 'Unknown',
    email: invoice.customers?.email || 'No email',
    image_url: invoice.customers?.image_url || '/images/fallback-avatar.png',
    amount: invoice.amount.toString(),
    status: invoice.status,
    date: invoice.date,
  }));
}
export async function fetchInvoicesPages(query: string): Promise<number> {
  const ITEMS_PER_PAGE = 10;

  try {
    const { data, error } = await supabase
    .from('invoices')
    .select(`
      id,
      amount,
      customer_id,
      customers (name, email, image_url)
    `)
    .or(`name.ilike.%${query}%, email.ilike.%${query}%`, { foreignTable: 'customers' }) // ✅ Correcte syntax
    .order('date', { ascending: false })
    .range(0, 9);
  
  if (error) {
    console.error('❌ Error fetching total invoice pages:', error);
    return 0;
  }
  
  console.log('✅ Filtered invoices count:', data.length);
  return Math.ceil((data.length || 0) / ITEMS_PER_PAGE);
  }
  catch (error) {
    console.error('❌ Error fetching total invoice pages:', error);
    return 0;
  }
}  

//fetchCustomers
export async function fetchCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase.from('customers').select('*');
  if (error) throw error;
  return data.map((customer: any) => ({
    id: customer.id,
    name: customer.name,
    email: customer.email,
    image_url: customer.image_url || FALLBACK_IMAGE,
  }));
}