import bcrypt from 'bcrypt';
import { db, sql, VercelPoolClient } from '@vercel/postgres';
import { invoices, customers, revenue, users } from '../lib/placeholder-data';

async function initializeDatabase() {
  const client = await db.connect();

  try {
    // Initialize UUID extension
    await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
    
    // Create tables if they don't exist
    await client.sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      );
    `;
    await client.sql`
      CREATE TABLE IF NOT EXISTS invoices (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        customer_id UUID NOT NULL,
        amount INT NOT NULL,
        status VARCHAR(255) NOT NULL,
        date DATE NOT NULL
      );
    `;
    await client.sql`
      CREATE TABLE IF NOT EXISTS customers (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        image_url VARCHAR(255) NOT NULL
      );
    `;
    await client.sql`
      CREATE TABLE IF NOT EXISTS revenue (
        month VARCHAR(4) NOT NULL UNIQUE,
        revenue INT NOT NULL
      );
    `;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw new Error('Database initialization failed');
  } finally {
    client.release();
  }
}

async function seedUsers(client: VercelPoolClient) {
  const insertedUsers = await Promise.all(
    users.map(async (user: { password: string | Buffer; id: any; name: any; email: any; }) => {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      return client.sql`
        INSERT INTO users (id, name, email, password)
        VALUES (${user.id}, ${user.name}, ${user.email}, ${hashedPassword})
        ON CONFLICT (id) DO NOTHING;
      `;
    }),
  );
  return insertedUsers;
}

async function seedInvoices(client: VercelPoolClient) {
  const insertedInvoices = await Promise.all(
    invoices.map((invoice: { customer_id: any; amount: any; status: any; date: any; }) => client.sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${invoice.customer_id}, ${invoice.amount}, ${invoice.status}, ${invoice.date})
      ON CONFLICT (id) DO NOTHING;
    `),
  );
  return insertedInvoices;
}

async function seedCustomers(client: VercelPoolClient) {
  const insertedCustomers = await Promise.all(
    customers.map((customer: { id: any; name: any; email: any; image_url: any; }) => client.sql`
      INSERT INTO customers (id, name, email, image_url)
      VALUES (${customer.id}, ${customer.name}, ${customer.email}, ${customer.image_url})
      ON CONFLICT (id) DO NOTHING;
    `),
  );
  return insertedCustomers;
}

async function seedRevenue(client: VercelPoolClient) {
  const insertedRevenue = await Promise.all(
    revenue.map((rev: { month: any; revenue: any; }) => client.sql`
      INSERT INTO revenue (month, revenue)
      VALUES (${rev.month}, ${rev.revenue})
      ON CONFLICT (month) DO NOTHING;
    `),
  );
  return insertedRevenue;
}

export async function GET() {
  const client = await db.connect();
  try {
    await client.sql`BEGIN`;
    await seedUsers(client);
    await seedCustomers(client);
    await seedInvoices(client);
    await seedRevenue(client);
    await client.sql`COMMIT`;

    return new Response(JSON.stringify({ message: 'Database seeded successfully' }), { status: 200 });
  } catch (error) {
    await client.sql`ROLLBACK`;
    if (error instanceof Error) {
      console.error('Seeding error:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    } else {
      console.error('Seeding error:', error);
      return new Response(JSON.stringify({ error: 'An unknown error occurred' }), { status: 500 });
    }
  } finally {
    client.release();
  }
}

export async function handleSignup(email: string | number | boolean | null | undefined, password: string | Buffer, name: string | number | boolean | null | undefined) {
  const client = await db.connect();
  try {
    // Check if the user already exists
    const existingUser = await client.sql`SELECT * FROM users WHERE email = ${email}`;
    if (existingUser.rows.length > 0) {
      throw new Error('User already exists');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user into the database
    await client.sql`
      INSERT INTO users (email, password, name)
      VALUES (${email}, ${hashedPassword}, ${name})
    `;

    return { message: 'User registered successfully' };
  } catch (error) {
    console.error('Error in signup:', error);
    if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error('An unknown error occurred');
    }
  } finally {
    client.release();
  }
}
