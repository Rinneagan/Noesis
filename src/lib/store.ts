import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Class, Student, AttendanceSession, AttendanceRecord } from '@/types';
import { db } from './database';

interface AppState {
  // Data
  classes: Class[];
  students: Student[];
  sessions: AttendanceSession[];
  initialized: boolean;
  
  // UI State
  darkMode: boolean;
  selectedClassId: string | null;
  
  // Actions
  initializeData: () => Promise<void>;
  refreshData: () => Promise<void>;
  
  addClass: (classData: Omit<Class, 'id'>) => Promise<void>;
  updateClass: (id: string, data: Partial<Class>) => Promise<void>;
  deleteClass: (id: string) => Promise<void>;
  
  addStudent: (studentData: Omit<Student, 'id'>) => Promise<void>;
  updateStudent: (id: string, data: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  
  addStudentToClass: (classId: string, student: Student) => Promise<void>;
  removeStudentFromClass: (classId: string, studentId: string) => Promise<void>;
  
  createAttendanceSession: (sessionData: Omit<AttendanceSession, 'id'>) => Promise<string>;
  updateAttendanceRecord: (sessionId: string, studentId: string, status: 'present' | 'absent' | 'late') => Promise<void>;
  saveAttendanceSession: (sessionId: string) => Promise<void>;
  
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
      classes: [],
      students: [],
      sessions: [],
      initialized: false,
      darkMode: false,
      selectedClassId: null,
      
      // Data initialization
      initializeData: async () => {
        if (get().initialized) return;
        
        try {
          // Seed data if empty
          await db.seedData();
          
          // Load data
          const classes = await db.getAllClasses();
          const sessions = await db.getAttendanceSessions();
          
          // Extract all unique students from classes
          const allStudents = classes.flatMap(cls => cls.students);
          const uniqueStudents = allStudents.filter((student, index, self) => 
            index === self.findIndex(s => s.id === student.id)
          );
          
          set({
            classes,
            students: uniqueStudents,
            sessions,
            initialized: true,
          });
        } catch (error) {
          console.error('Failed to initialize data:', error);
        }
      },
      
      refreshData: async () => {
        try {
          const classes = await db.getAllClasses();
          const sessions = await db.getAttendanceSessions();
          
          const allStudents = classes.flatMap(cls => cls.students);
          const uniqueStudents = allStudents.filter((student, index, self) => 
            index === self.findIndex(s => s.id === student.id)
          );
          
          set({
            classes,
            students: uniqueStudents,
            sessions,
          });
        } catch (error) {
          console.error('Failed to refresh data:', error);
        }
      },
      
      // Class actions
      addClass: async (classData) => {
        try {
          await db.createClass(classData);
          await get().refreshData();
        } catch (error) {
          console.error('Failed to add class:', error);
        }
      },
      
      updateClass: async (id, data) => {
        try {
          await db.updateClass(id, data);
          await get().refreshData();
        } catch (error) {
          console.error('Failed to update class:', error);
        }
      },
      
      deleteClass: async (id) => {
        try {
          await db.deleteClass(id);
          await get().refreshData();
        } catch (error) {
          console.error('Failed to delete class:', error);
        }
      },
      
      // Student actions
      addStudent: async (studentData) => {
        try {
          const student = {
            ...studentData,
            id: Date.now().toString(),
          };
          // Note: This would need to be implemented in the database
          await get().refreshData();
        } catch (error) {
          console.error('Failed to add student:', error);
        }
      },
      
      updateStudent: async (id, data) => {
        try {
          // Note: This would need to be implemented in the database
          await get().refreshData();
        } catch (error) {
          console.error('Failed to update student:', error);
        }
      },
      
      deleteStudent: async (id) => {
        try {
          // Note: This would need to be implemented in the database
          await get().refreshData();
        } catch (error) {
          console.error('Failed to delete student:', error);
        }
      },
      
      addStudentToClass: async (classId, student) => {
        try {
          await db.addStudentToClass(classId, student);
          await get().refreshData();
        } catch (error) {
          console.error('Failed to add student to class:', error);
        }
      },
      
      removeStudentFromClass: async (classId, studentId) => {
        try {
          await db.removeStudentFromClass(classId, studentId);
          await get().refreshData();
        } catch (error) {
          console.error('Failed to remove student from class:', error);
        }
      },
      
      // Attendance actions
      createAttendanceSession: async (sessionData) => {
        try {
          const session = await db.createAttendanceSession(sessionData);
          await get().refreshData();
          return session.id;
        } catch (error) {
          console.error('Failed to create attendance session:', error);
          return '';
        }
      },
      
      updateAttendanceRecord: async (sessionId, studentId, status) => {
        try {
          await db.updateAttendanceRecord(sessionId, studentId, status);
          await get().refreshData();
        } catch (error) {
          console.error('Failed to update attendance record:', error);
        }
      },
      
      saveAttendanceSession: async (sessionId) => {
        try {
          await db.endAttendanceSession(sessionId);
          await get().refreshData();
        } catch (error) {
          console.error('Failed to save attendance session:', error);
        }
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
      partialize: (state) => ({
        darkMode: state.darkMode,
        selectedClassId: state.selectedClassId,
      }),
    }
  )
);
