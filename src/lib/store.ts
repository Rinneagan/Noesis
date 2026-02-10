import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Class, Student, AttendanceSession, AttendanceRecord } from '@/types';
import { mockClasses, mockStudents, mockAttendanceSessions } from './data';

interface AppState {
  // Data
  classes: Class[];
  students: Student[];
  sessions: AttendanceSession[];
  
  // UI State
  darkMode: boolean;
  selectedClassId: string | null;
  
  // Actions
  addClass: (classData: Omit<Class, 'id'>) => void;
  updateClass: (id: string, data: Partial<Class>) => void;
  deleteClass: (id: string) => void;
  
  addStudent: (studentData: Omit<Student, 'id'>) => void;
  updateStudent: (id: string, data: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  
  addStudentToClass: (classId: string, student: Student) => void;
  removeStudentFromClass: (classId: string, studentId: string) => void;
  
  createAttendanceSession: (sessionData: Omit<AttendanceSession, 'id' | 'records'>) => string;
  updateAttendanceRecord: (sessionId: string, studentId: string, status: 'present' | 'absent' | 'late') => void;
  saveAttendanceSession: (sessionId: string) => void;
  
  toggleDarkMode: () => void;
  setSelectedClass: (classId: string | null) => void;
  
  // Utility
  exportData: () => string;
  importData: (data: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      classes: mockClasses,
      students: mockStudents,
      sessions: mockAttendanceSessions,
      darkMode: false,
      selectedClassId: null,
      
      // Class actions
      addClass: (classData) => {
        const newClass: Class = {
          ...classData,
          id: Date.now().toString(),
        };
        set((state) => ({
          classes: [...state.classes, newClass],
        }));
      },
      
      updateClass: (id, data) => {
        set((state) => ({
          classes: state.classes.map((c) =>
            c.id === id ? { ...c, ...data } : c
          ),
        }));
      },
      
      deleteClass: (id) => {
        set((state) => ({
          classes: state.classes.filter((c) => c.id !== id),
          sessions: state.sessions.filter((s) => s.classId !== id),
        }));
      },
      
      // Student actions
      addStudent: (studentData) => {
        const newStudent: Student = {
          ...studentData,
          id: Date.now().toString(),
        };
        set((state) => ({
          students: [...state.students, newStudent],
        }));
      },
      
      updateStudent: (id, data) => {
        set((state) => ({
          students: state.students.map((s) =>
            s.id === id ? { ...s, ...data } : s
          ),
          classes: state.classes.map((c) => ({
            ...c,
            students: c.students.map((s) =>
              s.id === id ? { ...s, ...data } : s
            ),
          })),
        }));
      },
      
      deleteStudent: (id) => {
        set((state) => ({
          students: state.students.filter((s) => s.id !== id),
          classes: state.classes.map((c) => ({
            ...c,
            students: c.students.filter((s) => s.id !== id),
          })),
          sessions: state.sessions.map((s) => ({
            ...s,
            records: s.records.filter((r) => r.studentId !== id),
          })),
        }));
      },
      
      addStudentToClass: (classId, student) => {
        set((state) => ({
          classes: state.classes.map((c) =>
            c.id === classId
              ? { ...c, students: [...c.students, student] }
              : c
          ),
        }));
      },
      
      removeStudentFromClass: (classId, studentId) => {
        set((state) => ({
          classes: state.classes.map((c) =>
            c.id === classId
              ? { ...c, students: c.students.filter((s) => s.id !== studentId) }
              : c
          ),
        }));
      },
      
      // Attendance actions
      createAttendanceSession: (sessionData) => {
        const sessionId = Date.now().toString();
        const newSession: AttendanceSession = {
          ...sessionData,
          id: sessionId,
          records: [],
        };
        set((state) => ({
          sessions: [...state.sessions, newSession],
        }));
        return sessionId;
      },
      
      updateAttendanceRecord: (sessionId, studentId, status) => {
        set((state) => ({
          sessions: state.sessions.map((s) => {
            if (s.id !== sessionId) return s;
            
            const existingRecordIndex = s.records.findIndex(
              (r) => r.studentId === studentId
            );
            
            const newRecord: AttendanceRecord = {
              id: `${sessionId}-${studentId}`,
              classId: s.classId,
              studentId,
              date: s.date,
              status,
              timestamp: new Date().toLocaleTimeString(),
            };
            
            if (existingRecordIndex >= 0) {
              return {
                ...s,
                records: s.records.map((r, index) =>
                  index === existingRecordIndex ? newRecord : r
                ),
              };
            } else {
              return {
                ...s,
                records: [...s.records, newRecord],
              };
            }
          }),
        }));
      },
      
      saveAttendanceSession: (sessionId) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, endTime: new Date().toLocaleTimeString() } : s
          ),
        }));
      },
      
      // UI actions
      toggleDarkMode: () => {
        set((state) => ({ darkMode: !state.darkMode }));
      },
      
      setSelectedClass: (classId) => {
        set({ selectedClassId: classId });
      },
      
      // Utility actions
      exportData: () => {
        const state = get();
        return JSON.stringify({
          classes: state.classes,
          students: state.students,
          sessions: state.sessions,
        }, null, 2);
      },
      
      importData: (data) => {
        try {
          const parsed = JSON.parse(data);
          set({
            classes: parsed.classes || [],
            students: parsed.students || [],
            sessions: parsed.sessions || [],
          });
        } catch (error) {
          console.error('Failed to import data:', error);
        }
      },
    }),
    {
      name: 'attendance-app-storage',
    }
  )
);
