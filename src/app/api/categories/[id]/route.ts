import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { categories } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await req.json();
    
    // allow updating color and name
    const updateData: Partial<typeof categories.$inferInsert> = {};
    if (body.color !== undefined) updateData.color = body.color;
    if (body.name !== undefined) updateData.name = body.name;

    const updatedCat = db.update(categories)
      .set(updateData)
      .where(eq(categories.id, id))
      .returning()
      .get();

    if (!updatedCat) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json(updatedCat);
  } catch (error: any) {
    console.error('Failed to update category:', error);
    if (error?.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return NextResponse.json({ error: 'Category name already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const deletedCat = db.delete(categories)
      .where(eq(categories.id, id))
      .returning()
      .get();

    if (!deletedCat) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json(deletedCat);
  } catch (error) {
    console.error('Failed to delete category:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
