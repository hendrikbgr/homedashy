import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrlStr = searchParams.get('url');

  if (!targetUrlStr) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  try {
    let urlObj: URL;
    try {
      urlObj = new URL(targetUrlStr.startsWith('http') ? targetUrlStr : `https://${targetUrlStr}`);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // AbortController to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    // Temporarily bypass self-signed cert errors for homelab URLs
    const originalRejectUnauthorized = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    let response;
    try {
      response = await fetch(urlObj.toString(), {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) HomedashyBot/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        },
      });
    } finally {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalRejectUnauthorized;
    }
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    let iconHref = null;

    // Search for common icon link tags
    const iconSelectors = [
      'link[rel="apple-touch-icon"]',
      'link[rel="apple-touch-icon-precomposed"]',
      'link[rel="icon" i]',
      'link[rel="shortcut icon" i]',
    ];

    for (const selector of iconSelectors) {
      const el = $(selector).first();
      const href = el.attr('href');
      if (href) {
        iconHref = href;
        break;
      }
    }

    // Try resolving extracted href
    if (iconHref) {
      try {
        const absoluteIconUrl = new URL(iconHref, urlObj.origin).toString();
        return NextResponse.json({ url: absoluteIconUrl });
      } catch (e) {
        // If it fails to parse, fallback to default
      }
    }

    // Fallback if no tag found or parsing failed: site root /favicon.ico
    const fallbackUrl = new URL('/favicon.ico', urlObj.origin).toString();
    return NextResponse.json({ url: fallbackUrl });

  } catch (error: any) {
    if (error.name === 'AbortError') {
      return NextResponse.json({ error: 'Request to endpoint timed out' }, { status: 504 });
    }
    console.error('Failed to fetch icon from url:', targetUrlStr, error);
    return NextResponse.json({ error: 'Failed to scrape url for icon' }, { status: 500 });
  }
}
