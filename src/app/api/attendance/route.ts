import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const date = searchParams.get('date');
    const studentId = searchParams.get('studentId');
    
    const sessions = await db.getAttendanceSessions({
      classId: classId || undefined,
      date: date || undefined,
      studentId: studentId || undefined,
    });
    
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Failed to fetch attendance sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance sessions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { classId, date, startTime, records } = body;
    
    const newSession = await db.createAttendanceSession({
      classId,
      date,
      startTime,
      records: records || [],
      isActive: true,
    });
    
    return NextResponse.json({ session: newSession }, { status: 201 });
  } catch (error) {
    console.error('Failed to create attendance session:', error);
    return NextResponse.json({ error: 'Failed to create attendance session' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, studentId, status } = body;
    
    const record = await db.updateAttendanceRecord(sessionId, studentId, status);
    
    return NextResponse.json({ record });
  } catch (error) {
    console.error('Failed to update attendance record:', error);
    return NextResponse.json({ error: 'Failed to update attendance record' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, endTime } = body;
    
    const session = await db.endAttendanceSession(sessionId, endTime);
    
    return NextResponse.json({ session });
  } catch (error) {
    console.error('Failed to end attendance session:', error);
    return NextResponse.json({ error: 'Failed to end attendance session' }, { status: 500 });
  }
}
