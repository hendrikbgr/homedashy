import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { apps, categories } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface HeimdallApp {
  title: string;
  colour: string; // Hex color e.g., "#fafbfc"
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

    let importCount = 0;

    // Use Drizzle transaction to safely process bulk inserts
    await db.transaction(async (tx) => {
      for (const item of body) {
        // Detect format: Homedashy or Heimdall
        const isHomedashy = 'name' in item && 'url' in item;
        const isHeimdall = 'title' in item && 'url' in item;

        if (!isHomedashy && !isHeimdall) continue;

        let name = '';
        let url = '';
        let description = '';
        let categoryName = 'Uncategorized';
        let iconUrl = '';
        let isActive = true;

        if (isHomedashy) {
          const hApp = item as HomedashyApp;
          name = hApp.name;
          url = hApp.url;
          description = hApp.description || '';
          categoryName = hApp.category || 'Uncategorized';
          iconUrl = hApp.iconUrl || '';
          isActive = hApp.isActive !== undefined ? hApp.isActive : true;
        } else {
          const hApp = item as HeimdallApp;
          name = hApp.title;
          url = hApp.url;
          description = hApp.appdescription || hApp.description || 'Imported from Heimdall';
          
          // Heimdall has colours. Let's create a Category for it if it looks like a hex/valid color string
          if (hApp.colour && hApp.colour !== '' && hApp.colour !== '#fafbfc' && hApp.colour !== '#161b1f') {
              categoryName = `Imported Theme (${hApp.colour})`;
              
              // Upsert category (check if exists, create if not)
              const existingCat = await tx.select().from(categories).where(eq(categories.name, categoryName)).get();
              if (!existingCat) {
                 await tx.insert(categories).values({
                   name: categoryName,
                   color: hApp.colour.startsWith('#') ? hApp.colour : `#${hApp.colour}`
                 }).run();
              }
          } else {
              categoryName = 'Heimdall Imports';
          }
        }

        // Ensure category exists
        const existingCat = await tx.select().from(categories).where(eq(categories.name, categoryName)).get();
        if (!existingCat) {
           await tx.insert(categories).values({
             name: categoryName,
             color: '#8b5cf6' // Default purple for new categories
           }).run();
        }

        // Insert the application
        await tx.insert(apps).values({
          name,
          url,
          description,
          category: categoryName,
          iconUrl,
          isActive: isActive
        }).run();

        importCount++;
      }
    });

    return NextResponse.json({ success: true, count: importCount }, { status: 201 });
  } catch (error: any) {
    console.error('Import failed:', error);
    return NextResponse.json({ error: 'Failed to mass-import applications' }, { status: 500 });
  }
}
