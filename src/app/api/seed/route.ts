import { NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function POST() {
  try {
    await db.seedData();
    return NextResponse.json({ message: 'Database seeded successfully' });
  } catch (error) {
    console.error('Failed to seed database:', error);
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 });
  }
}
