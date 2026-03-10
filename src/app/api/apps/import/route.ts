import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { apps, categories } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface HeimdallApp {
  title: string;
  colour: string; // Hex color e.g., "#fafbfc"
  url: string;
  description: string | null;
  appid: string;
  appdescription: string | null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: 'Expected a JSON array of Heimdall applications' }, { status: 400 });
    }

    const heimdallApps = body as HeimdallApp[];
    let importCount = 0;

    // Use Drizzle transaction to safely process bulk inserts
    await db.transaction(async (tx) => {
      for (const hApp of heimdallApps) {
        // Validation check
        if (!hApp.title || !hApp.url) continue;

        let categoryName = 'Uncategorized';

        // Heimdall has colours. Let's create a Category for it if it looks like a hex/valid color string
        if (hApp.colour && hApp.colour !== '' && hApp.colour !== '#fafbfc' && hApp.colour !== '#161b1f') { // avoiding generic black/white default heimdall themes
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
            const existingCat = await tx.select().from(categories).where(eq(categories.name, categoryName)).get();
            if (!existingCat) {
               await tx.insert(categories).values({
                 name: categoryName,
                 color: '#8b5cf6' // Purple default for generic imports
               }).run();
            }
        }

        // Insert the application
        await tx.insert(apps).values({
          name: hApp.title,
          url: hApp.url,
          description: hApp.appdescription || hApp.description || 'Imported from Heimdall',
          category: categoryName,
        }).run();

        importCount++;
      }
    });

    return NextResponse.json({ success: true, count: importCount }, { status: 201 });
  } catch (error: any) {
    console.error('Heimdall import failed:', error);
    if (error?.code?.includes('CONSTRAINT')) {
       // Log constraints but continue or fail gracefully
    }
    return NextResponse.json({ error: 'Failed to mass-import applications' }, { status: 500 });
  }
}
