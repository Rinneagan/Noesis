import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthState } from '@/types';

// Mock users for demonstration
const mockUsers: User[] = [
  {
    id: 'lecturer-1',
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@university.edu',
    role: 'lecturer',
    lecturerId: 'LEC001',
    taughtClasses: ['1', '2'],
  },
  {
    id: 'student-1',
    name: 'John Doe',
    email: 'john.doe@university.edu',
    role: 'student',
    studentId: 'STU001',
    enrolledClasses: ['1'],
  },
  {
    id: 'student-2',
    name: 'Jane Smith',
    email: 'jane.smith@university.edu',
    role: 'student',
    studentId: 'STU002',
    enrolledClasses: ['1', '2'],
  },
  {
    id: 'student-3',
    name: 'Mike Johnson',
    email: 'mike.johnson@university.edu',
    role: 'student',
    studentId: 'STU003',
    enrolledClasses: ['2'],
  },
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        // Mock authentication - in production, this would call an API
        const user = mockUsers.find(u => u.email === email);
        
        if (user && password === 'password') {
          set({ user, isAuthenticated: true });
          return true;
        }
        
        return false;
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

// Mock authentication hook
export const useAuth = () => {
  const auth = useAuthStore();
  
  const isLecturer = auth.user?.role === 'lecturer';
  const isStudent = auth.user?.role === 'student';
  
  return {
    ...auth,
    isLecturer,
    isStudent,
  };
};
