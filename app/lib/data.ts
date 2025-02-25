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
console.log('SUPABASE_URL:', process.env.SUPABASE_URL || 'Not loaded');
console.log('SUPABASE_KEY:', process.env.SUPABASE_KEY || 'Not loaded');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not loaded');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'Not loaded');
const FALLBACK_IMAGE = '/images/fallback-avatar.png';

export async function fetchRevenue(): Promise<Revenue[]> {
  const { data, error } = await supabase.from('revenue').select('month, revenue');
  if (error) throw error;
  return data;
}

export async function fetchLatestInvoices(): Promise<LatestInvoice[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      id,
      amount,
      customers!inner(name, email, image_url)
    `)
    .order('date', { ascending: false })
    .limit(5);

  if (error) throw error;

  return data.map((invoice) => ({
    id: invoice.id,
    name: invoice.customers?.[0]?.name ?? 'Unknown',       // ✅ Gebruik [0]
    email: invoice.customers?.[0]?.email ?? 'No email',    // ✅ Gebruik [0]
    image_url: invoice.customers?.[0]?.image_url ?? '/images/fallback-avatar.png',
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
