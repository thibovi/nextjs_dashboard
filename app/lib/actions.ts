'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

const FormSchema = z.object({
  customer_id: z.string(),
  amount: z.coerce.number().min(0, "Amount must be positive"),
  status: z.enum(['pending', 'paid']),
});

export async function createInvoice(formData: FormData): Promise<void> {
  const validatedData = FormSchema.safeParse({
    customer_id: formData.get('customerId') as string,
    amount: Number(formData.get('amount')) * 100, // Opslaan in centen
    status: formData.get('status') as 'pending' | 'paid',
  });

  if (!validatedData.success) {
    console.error("Validation Error:", validatedData.error.format());
    return;
  }

  // Huidige datum in 'YYYY-MM-DD' formaat
  const date = new Date().toISOString().split('T')[0];

  const { error } = await supabase.from('invoices').insert({
    customer_id: validatedData.data.customer_id,
    amount: validatedData.data.amount,
    status: validatedData.data.status,
    date,
  });

  if (error) {
    console.error("Error inserting invoice:", error);
    return;
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

//async function updateinvoice
export async function updateInvoice(id: string, formData: FormData): Promise<void> {
  const validatedData = FormSchema.safeParse({
    customer_id: formData.get('customerId') as string,
    amount: Number(formData.get('amount')) * 100, // Opslaan in centen
    status: formData.get('status') as 'pending' | 'paid',
  });

  if (!validatedData.success) {
    console.error("Validation Error:", validatedData.error.format());
    return;
  }

  const { error } = await supabase.from('invoices').update({
    customer_id: validatedData.data.customer_id,
    amount: validatedData.data.amount,
    status: validatedData.data.status,
  }).match({ id });

  if (error) {
    console.error("Error updating invoice:", error);
    return;
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}