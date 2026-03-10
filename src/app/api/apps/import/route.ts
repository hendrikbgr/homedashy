import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { apps, categories } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface HeimdallApp {
  title: string;
  colour: string;
  url: string;
  description: string | null;
  appid?: string;
  appdescription?: string | null;
}

interface HomedashyApp {
  name: string;
  url: string;
  description?: string;
  iconUrl?: string;
  category?: string;
  isActive?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!Array.isArray(body)) {
      return NextResponse.json({ error: 'Expected a JSON array of applications' }, { status: 400 });
    }

    // Pre-process all items BEFORE the transaction (can use async here)
    const itemsToInsert: Array<{
      name: string;
      url: string;
      description: string;
      categoryName: string;
      iconUrl: string;
      isActive: boolean;
    }> = [];

    for (const item of body) {
      const isHomedashy = 'name' in item && 'url' in item;
      const isHeimdall = 'title' in item && 'url' in item;

      if (!isHomedashy && !isHeimdall) continue;

      if (isHomedashy) {
        const h = item as HomedashyApp;
        if (!h.name || !h.url) continue;
        itemsToInsert.push({
          name: h.name,
          url: h.url,
          description: h.description || '',
          categoryName: h.category || 'Uncategorized',
          iconUrl: h.iconUrl || '',
          isActive: h.isActive !== undefined ? h.isActive : true,
        });
      } else {
        const h = item as HeimdallApp;
        if (!h.title || !h.url) continue;
        let categoryName = 'Heimdall Imports';
        if (h.colour && h.colour !== '' && h.colour !== '#fafbfc' && h.colour !== '#161b1f') {
          categoryName = `Imported Theme (${h.colour})`;
        }
        itemsToInsert.push({
          name: h.title,
          url: h.url,
          description: h.appdescription || h.description || '',
          categoryName,
          iconUrl: '',
          isActive: true,
        });
      }
    }

    if (itemsToInsert.length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }

    // Use synchronous transaction (better-sqlite3 requirement)
    const importFn = db.transaction((items: typeof itemsToInsert) => {
      let count = 0;
      for (const item of items) {
        // Ensure category exists (synchronous)
        const existingCat = db.select().from(categories).where(eq(categories.name, item.categoryName)).get();
        if (!existingCat) {
          db.insert(categories).values({
            name: item.categoryName,
            color: '#8b5cf6',
          }).run();
        }

        db.insert(apps).values({
          name: item.name,
          url: item.url,
          description: item.description,
          category: item.categoryName,
          iconUrl: item.iconUrl,
          isActive: item.isActive,
        }).run();

        count++;
      }
      return count;
    });

    const importCount = importFn(itemsToInsert);

    return NextResponse.json({ success: true, count: importCount }, { status: 201 });
  } catch (error: any) {
    console.error('Import failed:', error);
    return NextResponse.json({ error: 'Failed to mass-import applications' }, { status: 500 });
  }
}
