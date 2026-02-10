export interface Student {
  id: string;
  name: string;
  email: string;
  studentId: string;
}

export interface Class {
  id: string;
  name: string;
  description: string;
  students: Student[];
  lecturerId: string;
}

export interface AttendanceRecord {
  id: string;
  classId: string;
  studentId: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  timestamp: string;
}

export interface AttendanceSession {
  id: string;
  classId: string;
  date: string;
  startTime: string;
  endTime?: string;
  records: AttendanceRecord[];
  isActive: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'lecturer' | 'student';
  studentId?: string;
  lecturerId?: string;
  enrolledClasses?: string[];
  taughtClasses?: string[];
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}
