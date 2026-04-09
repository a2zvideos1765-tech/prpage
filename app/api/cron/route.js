import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    // Vercel sends an authorization header on Cron jobs to ensure no one else calls this endpoint
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Ping the Supabase Database to keep it awake
    await prisma.user.findFirst();

    return NextResponse.json({ status: "Supabase DB Pinged Successfully" });
  } catch (error) {
    console.error("Cron Ping Failed: ", error);
    return NextResponse.json({ error: "Failed to ping DB" }, { status: 500 });
  }
}
