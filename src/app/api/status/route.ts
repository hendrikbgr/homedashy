import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { apps as appsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const allApps = db.select().from(appsTable).where(eq(appsTable.isActive, true)).all();
    
    // We'll check each app. For performance in a real world app we might want to cache this 
    // or limit the number of concurrent checks, but for a homelab dashboard this is fine.
    
    const statusPromises = allApps.map(async (app) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
      
      const originalRejectUnauthorized = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      
      const start = Date.now();
      try {
        const response = await fetch(app.url, {
          signal: controller.signal,
          headers: { 'User-Agent': 'Homedashy-Status-Check/1.0' },
          cache: 'no-store'
        });
        
        return {
          id: app.id,
          name: app.name,
          online: response.ok || response.status < 500, // Even 404 means the server responded
          status: response.status,
          latency: Date.now() - start
        };
      } catch (error) {
        return {
          id: app.id,
          name: app.name,
          online: false,
          status: 0,
          latency: Date.now() - start
        };
      } finally {
        clearTimeout(timeoutId);
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalRejectUnauthorized;
      }
    });

    const results = await Promise.all(statusPromises);
    return NextResponse.json(results);
  } catch (error) {
    console.error('Status check failed:', error);
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 });
  }
}
