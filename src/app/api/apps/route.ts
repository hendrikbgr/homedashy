import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { apps, categories } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const allApps = db
      .select({
        id: apps.id,
        name: apps.name,
        url: apps.url,
        description: apps.description,
        iconUrl: apps.iconUrl,
        category: apps.category,
        isActive: apps.isActive,
        categoryColor: categories.color,
        createdAt: apps.createdAt,
      })
      .from(apps)
      .leftJoin(categories, eq(apps.category, categories.name))
      .all();
      
    return NextResponse.json(allApps);
  } catch (error) {
    console.error('Error fetching apps:', error);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, url, description, category, iconUrl, isActive } = body;

    if (!name || !url) {
      return NextResponse.json({ error: 'Name and URL are required' }, { status: 400 });
    }

    const newApp = db.insert(apps).values({
      name,
      url,
      description,
      category: category || 'Uncategorized',
      iconUrl,
      isActive: isActive !== undefined ? isActive : true,
    }).returning().get();

    return NextResponse.json(newApp, { status: 201 });
  } catch (error) {
    console.error('Error creating app:', error);
    return NextResponse.json({ error: 'Failed to create application' }, { status: 500 });
  }
}
