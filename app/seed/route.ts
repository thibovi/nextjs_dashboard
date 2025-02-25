import bcrypt from 'bcrypt';
import { createClient } from '@supabase/supabase-js';
import { invoices, customers, revenue, users } from '../lib/placeholder-data';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);


async function seedUsers() {
  await supabase.rpc('seed_users'); // ✅ Gebruik een SQL-function indien nodig

  const insertedUsers = await Promise.all(
    users.map(async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      const { error } = await supabase.from('users').insert({
        id: user.id,
        name: user.name,
        email: user.email,
        password: hashedPassword,
      });
      if (error) console.error('Error inserting user:', error.message);
    })
  );

  return insertedUsers;
}


async function seedCustomers() {
  const insertedCustomers = await Promise.all(
    customers.map(async (customer) => {
      const { error } = await supabase.from('customers').insert({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        image_url: customer.image_url,
      });
      if (error) console.error('Error inserting customer:', error.message);
    })
  );

  return insertedCustomers;
}


async function seedInvoices() {
  const insertedInvoices = await Promise.all(
    invoices.map(async (invoice) => {
      const { error } = await supabase.from('invoices').insert({
        customer_id: invoice.customer_id,
        amount: invoice.amount,
        status: invoice.status,
        date: invoice.date,
      });
      if (error) console.error('Error inserting invoice:', error.message);
    })
  );

  return insertedInvoices;
}


async function seedRevenue() {
  const insertedRevenue = await Promise.all(
    revenue.map(async (rev) => {
      const { error } = await supabase.from('revenue').insert({
        month: rev.month,
        revenue: rev.revenue,
      });
      if (error) console.error('Error inserting revenue:', error.message);
    })
  );

  return insertedRevenue;
}


export async function GET() {
  try {
    await seedUsers();
    await seedCustomers();
    await seedInvoices();
    await seedRevenue();

    return Response.json({ message: 'Database seeded successfully' });
  } catch (error) {
    console.error('Seeding Error:', error);
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}


