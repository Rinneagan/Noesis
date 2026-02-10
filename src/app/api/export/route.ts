import { NextRequest, NextResponse } from 'next/server';

// Mock data - in production, this would come from a database
const mockData = {
  classes: [
    { id: '1', name: 'Introduction to Computer Science', students: 25 },
    { id: '2', name: 'Web Development', students: 20 },
  ],
  sessions: [
    { id: '1', classId: '1', date: '2024-01-15', records: 25 },
    { id: '2', classId: '2', date: '2024-01-16', records: 20 },
  ],
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { format, type, filters } = body;
    
    let data: any[] = [];
    let filename = '';
    
    switch (type) {
      case 'attendance':
        data = generateAttendanceData(filters);
        filename = 'attendance_report';
        break;
      case 'classes':
        data = generateClassData(filters);
        filename = 'classes_report';
        break;
      case 'students':
        data = generateStudentData(filters);
        filename = 'students_report';
        break;
      default:
        return NextResponse.json({ error: 'Invalid export type' }, { status: 400 });
    }
    
    if (format === 'csv') {
      const csv = convertToCSV(data);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
        },
      });
    } else if (format === 'json') {
      return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}.json"`,
        },
      });
    } else {
      return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}

function generateAttendanceData(filters: any) {
  // Mock attendance data generation
  return [
    {
      'Student Name': 'John Doe',
      'Student ID': 'STU001',
      'Class': 'Introduction to Computer Science',
      'Date': '2024-01-15',
      'Status': 'Present',
      'Timestamp': '09:05:00',
    },
    {
      'Student Name': 'Jane Smith',
      'Student ID': 'STU002',
      'Class': 'Introduction to Computer Science',
      'Date': '2024-01-15',
      'Status': 'Late',
      'Timestamp': '09:15:00',
    },
  ];
}

function generateClassData(filters: any) {
  return mockData.classes.map(cls => ({
    'Class ID': cls.id,
    'Class Name': cls.name,
    'Number of Students': cls.students,
    'Created Date': '2024-01-01',
  }));
}

function generateStudentData(filters: any) {
  return [
    {
      'Student ID': 'STU001',
      'Student Name': 'John Doe',
      'Email': 'john@example.com',
      'Total Sessions': 10,
      'Present': 8,
      'Late': 1,
      'Absent': 1,
      'Attendance Rate': '80%',
    },
    {
      'Student ID': 'STU002',
      'Student Name': 'Jane Smith',
      'Email': 'jane@example.com',
      'Total Sessions': 10,
      'Present': 9,
      'Late': 1,
      'Absent': 0,
      'Attendance Rate': '90%',
    },
  ];
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      // Handle values that contain commas or quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  });
  
  return [csvHeaders, ...csvRows].join('\\n');
}
