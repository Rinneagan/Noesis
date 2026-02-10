import { NextRequest, NextResponse } from 'next/server';

// Mock database for attendance sessions
let attendanceSessions: any[] = [];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const date = searchParams.get('date');
    const studentId = searchParams.get('studentId');
    
    let filteredSessions = attendanceSessions;
    
    if (classId) {
      filteredSessions = filteredSessions.filter(session => session.classId === classId);
    }
    
    if (date) {
      filteredSessions = filteredSessions.filter(session => session.date === date);
    }
    
    if (studentId) {
      filteredSessions = filteredSessions.map(session => ({
        ...session,
        records: session.records.filter((record: any) => record.studentId === studentId)
      }));
    }
    
    return NextResponse.json({ sessions: filteredSessions });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch attendance sessions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { classId, date, startTime, records } = body;
    
    const newSession = {
      id: Date.now().toString(),
      classId,
      date,
      startTime,
      endTime: null,
      records: records || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    attendanceSessions.push(newSession);
    
    return NextResponse.json({ session: newSession }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create attendance session' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, studentId, status } = body;
    
    const sessionIndex = attendanceSessions.findIndex(session => session.id === sessionId);
    
    if (sessionIndex === -1) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    
    const session = attendanceSessions[sessionIndex];
    const existingRecordIndex = session.records.findIndex((record: any) => record.studentId === studentId);
    
    const newRecord = {
      id: `${sessionId}-${studentId}`,
      classId: session.classId,
      studentId,
      date: session.date,
      status,
      timestamp: new Date().toLocaleTimeString(),
    };
    
    if (existingRecordIndex >= 0) {
      session.records[existingRecordIndex] = newRecord;
    } else {
      session.records.push(newRecord);
    }
    
    session.updatedAt = new Date().toISOString();
    
    return NextResponse.json({ record: newRecord });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update attendance record' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, endTime } = body;
    
    const sessionIndex = attendanceSessions.findIndex(session => session.id === sessionId);
    
    if (sessionIndex === -1) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    
    attendanceSessions[sessionIndex].endTime = endTime || new Date().toLocaleTimeString();
    attendanceSessions[sessionIndex].updatedAt = new Date().toISOString();
    
    return NextResponse.json({ session: attendanceSessions[sessionIndex] });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to end attendance session' }, { status: 500 });
  }
}
