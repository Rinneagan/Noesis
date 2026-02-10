import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    
    const classes = await db.getAllClasses(search || undefined);
    
    return NextResponse.json({ classes });
  } catch (error) {
    console.error('Failed to fetch classes:', error);
    return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newClass = await db.createClass(body);
    
    return NextResponse.json({ class: newClass }, { status: 201 });
  } catch (error) {
    console.error('Failed to create class:', error);
    return NextResponse.json({ error: 'Failed to create class' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    
    const updatedClass = await db.updateClass(id, updateData);
    
    if (!updatedClass) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }
    
    return NextResponse.json({ class: updatedClass });
  } catch (error) {
    console.error('Failed to update class:', error);
    return NextResponse.json({ error: 'Failed to update class' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Class ID is required' }, { status: 400 });
    }
    
    const deleted = await db.deleteClass(id);
    
    if (!deleted) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Failed to delete class:', error);
    return NextResponse.json({ error: 'Failed to delete class' }, { status: 500 });
  }
}
