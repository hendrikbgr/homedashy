import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { categories } from '@/db/schema';

export async function GET() {
  try {
    const allCategories = db.select().from(categories).all();
    return NextResponse.json(allCategories);
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, color } = body;

    // basic validation
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Generate random HSL color if not provided
    let finalColor = color;
    if (!finalColor) {
      const hue = Math.floor(Math.random() * 360);
      finalColor = `hsl(${hue}, 80%, 65%)`;
    }

    const newCategory = db.insert(categories).values({
      name,
      color: finalColor
    }).returning().get();

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create category:', error);
    // basic constraint error check (e.g. duplicate name)
    if (error?.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return NextResponse.json({ error: 'Category strictly exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
