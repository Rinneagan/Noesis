import { Class, Student, AttendanceRecord, AttendanceSession, User } from '@/types';

// Simple in-memory database with localStorage persistence
class Database {
  private users: User[] = [];
  private classes: Class[] = [];
  private attendanceSessions: AttendanceSession[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window !== 'undefined') {
      const users = localStorage.getItem('users');
      const classes = localStorage.getItem('classes');
      const sessions = localStorage.getItem('attendanceSessions');

      if (users) this.users = JSON.parse(users);
      if (classes) this.classes = JSON.parse(classes);
      if (sessions) this.attendanceSessions = JSON.parse(sessions);
    }
  }

  private saveToStorage() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('users', JSON.stringify(this.users));
      localStorage.setItem('classes', JSON.stringify(this.classes));
      localStorage.setItem('attendanceSessions', JSON.stringify(this.attendanceSessions));
    }
  }

  // User operations
  async createUser(userData: Omit<User, 'id'>): Promise<User> {
    const user: User = {
      id: Date.now().toString(),
      ...userData,
    };
    this.users.push(user);
    this.saveToStorage();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.users.find(user => user.email === email) || null;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.find(user => user.id === id) || null;
  }

  async getAllUsers(): Promise<User[]> {
    return this.users;
  }

  // Class operations
  async createClass(classData: Omit<Class, 'id'>): Promise<Class> {
    const newClass: Class = {
      id: Date.now().toString(),
      ...classData,
    };
    this.classes.push(newClass);
    this.saveToStorage();
    return newClass;
  }

  async getClassById(id: string): Promise<Class | null> {
    return this.classes.find(cls => cls.id === id) || null;
  }

  async getAllClasses(search?: string): Promise<Class[]> {
    if (!search) return this.classes;
    
    const searchLower = search.toLowerCase();
    return this.classes.filter(cls => 
      cls.name.toLowerCase().includes(searchLower) ||
      cls.description.toLowerCase().includes(searchLower)
    );
  }

  async updateClass(id: string, updateData: Partial<Class>): Promise<Class | null> {
    const index = this.classes.findIndex(cls => cls.id === id);
    if (index === -1) return null;

    this.classes[index] = { ...this.classes[index], ...updateData };
    this.saveToStorage();
    return this.classes[index];
  }

  async deleteClass(id: string): Promise<boolean> {
    const index = this.classes.findIndex(cls => cls.id === id);
    if (index === -1) return false;

    this.classes.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  // Student operations
  async addStudentToClass(classId: string, student: Student): Promise<void> {
    const classIndex = this.classes.findIndex(cls => cls.id === classId);
    if (classIndex === -1) throw new Error('Class not found');

    const existingStudent = this.classes[classIndex].students.find(s => s.id === student.id);
    if (existingStudent) throw new Error('Student already enrolled');

    this.classes[classIndex].students.push(student);
    this.saveToStorage();
  }

  async removeStudentFromClass(classId: string, studentId: string): Promise<void> {
    const classIndex = this.classes.findIndex(cls => cls.id === classId);
    if (classIndex === -1) throw new Error('Class not found');

    this.classes[classIndex].students = this.classes[classIndex].students.filter(
      s => s.id !== studentId
    );
    this.saveToStorage();
  }

  // Attendance Session operations
  async createAttendanceSession(sessionData: Omit<AttendanceSession, 'id'>): Promise<AttendanceSession> {
    const session: AttendanceSession = {
      id: Date.now().toString(),
      ...sessionData,
    };
    this.attendanceSessions.push(session);
    this.saveToStorage();
    return session;
  }

  async getAttendanceSession(id: string): Promise<AttendanceSession | null> {
    return this.attendanceSessions.find(session => session.id === id) || null;
  }

  async getAttendanceSessions(filters?: {
    classId?: string;
    date?: string;
    studentId?: string;
  }): Promise<AttendanceSession[]> {
    let sessions = this.attendanceSessions;

    if (filters?.classId) {
      sessions = sessions.filter(session => session.classId === filters.classId);
    }

    if (filters?.date) {
      sessions = sessions.filter(session => session.date === filters.date);
    }

    if (filters?.studentId) {
      sessions = sessions.map(session => ({
        ...session,
        records: session.records.filter(record => record.studentId === filters.studentId)
      }));
    }

    return sessions;
  }

  async updateAttendanceRecord(
    sessionId: string,
    studentId: string,
    status: 'present' | 'absent' | 'late'
  ): Promise<AttendanceRecord> {
    const sessionIndex = this.attendanceSessions.findIndex(session => session.id === sessionId);
    if (sessionIndex === -1) throw new Error('Session not found');

    const session = this.attendanceSessions[sessionIndex];
    const existingRecordIndex = session.records.findIndex(
      record => record.studentId === studentId
    );

    const record: AttendanceRecord = {
      id: `${sessionId}-${studentId}`,
      classId: session.classId,
      studentId,
      date: session.date,
      status,
      timestamp: new Date().toLocaleTimeString(),
    };

    if (existingRecordIndex >= 0) {
      session.records[existingRecordIndex] = record;
    } else {
      session.records.push(record);
    }

    this.saveToStorage();
    return record;
  }

  async endAttendanceSession(sessionId: string, endTime?: string): Promise<AttendanceSession> {
    const sessionIndex = this.attendanceSessions.findIndex(session => session.id === sessionId);
    if (sessionIndex === -1) throw new Error('Session not found');

    this.attendanceSessions[sessionIndex].isActive = false;
    this.attendanceSessions[sessionIndex].endTime = endTime || new Date().toLocaleTimeString();

    this.saveToStorage();
    return this.attendanceSessions[sessionIndex];
  }

  // Seed data
  async seedData(): Promise<void> {
    if (this.classes.length > 0) return; // Already seeded

    // Create sample users
    const lecturer: User = {
      id: 'lecturer-1',
      name: 'Dr. John Smith',
      email: 'lecturer@example.com',
      role: 'lecturer',
      lecturerId: 'LEC001',
    };

    const students: User[] = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'student',
        studentId: 'STU001',
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'student',
        studentId: 'STU002',
      },
      {
        id: '3',
        name: 'Mike Johnson',
        email: 'mike@example.com',
        role: 'student',
        studentId: 'STU003',
      },
      {
        id: '4',
        name: 'Sarah Williams',
        email: 'sarah@example.com',
        role: 'student',
        studentId: 'STU004',
      },
      {
        id: '5',
        name: 'Tom Brown',
        email: 'tom@example.com',
        role: 'student',
        studentId: 'STU005',
      },
    ];

    this.users.push(lecturer, ...students);

    // Create sample classes
    const class1Students: Student[] = students.slice(0, 3).map(s => ({
      id: s.id,
      name: s.name,
      email: s.email,
      studentId: s.studentId!,
    }));

    const class2Students: Student[] = students.slice(2, 5).map(s => ({
      id: s.id,
      name: s.name,
      email: s.email,
      studentId: s.studentId!,
    }));

    const classes: Class[] = [
      {
        id: '1',
        name: 'Introduction to Computer Science',
        description: 'Basic concepts of programming and computer science',
        students: class1Students,
        lecturerId: lecturer.id,
      },
      {
        id: '2',
        name: 'Web Development',
        description: 'Modern web development with React and Next.js',
        students: class2Students,
        lecturerId: lecturer.id,
      },
    ];

    this.classes.push(...classes);

    // Create sample attendance sessions
    const attendanceSessions: AttendanceSession[] = [
      {
        id: '1',
        classId: '1',
        date: '2024-01-15',
        startTime: '09:00',
        endTime: '10:30',
        isActive: false,
        records: [
          {
            id: '1',
            classId: '1',
            studentId: '1',
            date: '2024-01-15',
            status: 'present',
            timestamp: '09:05',
          },
          {
            id: '2',
            classId: '1',
            studentId: '2',
            date: '2024-01-15',
            status: 'present',
            timestamp: '09:02',
          },
          {
            id: '3',
            classId: '1',
            studentId: '3',
            date: '2024-01-15',
            status: 'late',
            timestamp: '09:15',
          },
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
          {
            id: '4',
            classId: '2',
            studentId: '3',
            date: '2024-01-16',
            status: 'present',
            timestamp: '14:03',
          },
          {
            id: '5',
            classId: '2',
            studentId: '4',
            date: '2024-01-16',
            status: 'absent',
            timestamp: '',
          },
          {
            id: '6',
            classId: '2',
            studentId: '5',
            date: '2024-01-16',
            status: 'present',
            timestamp: '14:01',
          },
        ],
      },
    ];

    this.attendanceSessions.push(...attendanceSessions);
    this.saveToStorage();
  }
}

export const db = new Database();
