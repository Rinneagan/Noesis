import { Class, Student, AttendanceRecord, AttendanceSession } from '@/types';

// Mock data for demonstration
export const mockStudents: Student[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', studentId: 'STU001' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', studentId: 'STU002' },
  { id: '3', name: 'Mike Johnson', email: 'mike@example.com', studentId: 'STU003' },
  { id: '4', name: 'Sarah Williams', email: 'sarah@example.com', studentId: 'STU004' },
  { id: '5', name: 'Tom Brown', email: 'tom@example.com', studentId: 'STU005' },
];

export const mockClasses: Class[] = [
  {
    id: '1',
    name: 'Introduction to Computer Science',
    description: 'Basic concepts of programming and computer science',
    students: mockStudents.slice(0, 3),
    lecturerId: 'lecturer-1',
  },
  {
    id: '2',
    name: 'Web Development',
    description: 'Modern web development with React and Next.js',
    students: mockStudents.slice(2, 5),
    lecturerId: 'lecturer-1',
  },
];

export const mockAttendanceSessions: AttendanceSession[] = [
  {
    id: '1',
    classId: '1',
    date: '2024-01-15',
    startTime: '09:00',
    endTime: '10:30',
    isActive: false,
    records: [
      { id: '1', classId: '1', studentId: '1', date: '2024-01-15', status: 'present', timestamp: '09:05' },
      { id: '2', classId: '1', studentId: '2', date: '2024-01-15', status: 'present', timestamp: '09:02' },
      { id: '3', classId: '1', studentId: '3', date: '2024-01-15', status: 'late', timestamp: '09:15' },
    ],
  },
  {
    id: '2',
    classId: '2',
    date: '2024-01-16',
    startTime: '14:00',
    endTime: '15:30',
    isActive: false,
    records: [
      { id: '4', classId: '2', studentId: '3', date: '2024-01-16', status: 'present', timestamp: '14:03' },
      { id: '5', classId: '2', studentId: '4', date: '2024-01-16', status: 'absent', timestamp: '' },
      { id: '6', classId: '2', studentId: '5', date: '2024-01-16', status: 'present', timestamp: '14:01' },
    ],
  },
];
