import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { apps } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = parseInt((await params).id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await req.json();
    
    // Support partial updates
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.url !== undefined) updateData.url = body.url;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.category !== undefined) updateData.category = body.category || 'Uncategorized';
    if (body.iconUrl !== undefined) updateData.iconUrl = body.iconUrl;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const updatedApp = db.update(apps)
      .set(updateData)
      .where(eq(apps.id, id))
      .returning()
      .get();

    if (!updatedApp) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    return NextResponse.json(updatedApp);
  } catch (error) {
    console.error('Error updating app:', error);
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = parseInt((await params).id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const deletedApp = db.delete(apps)
      .where(eq(apps.id, id))
      .returning()
      .get();

    if (!deletedApp) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'App deleted successfully' });
  } catch (error) {
    console.error('Error deleting app:', error);
    return NextResponse.json({ error: 'Failed to delete application' }, { status: 500 });
  }
}
