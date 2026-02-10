import { NextRequest, NextResponse } from 'next/server';
import { useAppStore } from '@/lib/store';

// Mock database - in production, this would be a real database
let classes: any[] = [];
let students: any[] = [];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    
    let filteredClasses = classes;
    
    if (search) {
      filteredClasses = classes.filter(cls => 
        cls.name.toLowerCase().includes(search.toLowerCase()) ||
        cls.description.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    return NextResponse.json({ classes: filteredClasses });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newClass = {
      id: Date.now().toString(),
      ...body,
      students: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    classes.push(newClass);
    
    return NextResponse.json({ class: newClass }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create class' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    
    const classIndex = classes.findIndex(cls => cls.id === id);
    
    if (classIndex === -1) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }
    
    classes[classIndex] = {
      ...classes[classIndex],
      ...updateData,
      updatedAt: new Date().toISOString(),
    };
    
    return NextResponse.json({ class: classes[classIndex] });
  } catch (error) {
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
    
    const classIndex = classes.findIndex(cls => cls.id === id);
    
    if (classIndex === -1) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }
    
    classes.splice(classIndex, 1);
    
    return NextResponse.json({ message: 'Class deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete class' }, { status: 500 });
  }
}
