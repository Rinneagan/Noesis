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
  location?: ClassLocation;
}

export interface ClassLocation {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius: number; // meters for geofencing
}

export interface AttendanceRecord {
  id: string;
  classId: string;
  studentId: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  timestamp: string;
  checkInMethod?: 'manual' | 'qr' | 'photo' | 'location' | 'nfc';
  location?: AttendanceLocation;
  photo?: string; // base64 encoded photo
  deviceInfo?: DeviceInfo;
}

export interface AttendanceLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  isWithinGeofence?: boolean;
}

export interface DeviceInfo {
  userAgent: string;
  platform: string;
  timestamp: number;
}

export interface AttendanceSession {
  id: string;
  classId: string;
  date: string;
  startTime: string;
  endTime?: string;
  records: AttendanceRecord[];
  isActive: boolean;
  qrCode?: QRCodeData;
  rules?: AttendanceRules;
}

export interface QRCodeData {
  id: string;
  sessionId: string;
  data: string;
  expiresAt: Date;
  createdAt: Date;
  isActive: boolean;
}

export interface AttendanceRules {
  lateThreshold: number; // minutes after start time
  autoMarkAbsent: number; // minutes after class ends
  gracePeriod: number; // minutes before class starts
  requireLocation: boolean;
  requirePhoto: boolean;
  maxDistance: number; // meters from classroom
  allowQRCode: boolean;
  allowManual: boolean;
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
  profilePicture?: string;
  phone?: string;
  notifications?: NotificationSettings;
}

export interface NotificationSettings {
  email: boolean;
  sms: boolean;
  push: boolean;
  absenceAlerts: boolean;
  gradeAlerts: boolean;
  classReminders: boolean;
}

export interface CheckInRequest {
  sessionId: string;
  studentId: string;
  qrCodeData?: string;
  location?: AttendanceLocation;
  photo?: string;
  deviceInfo?: DeviceInfo;
  timestamp: number;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'absence' | 'late' | 'reminder' | 'alert' | 'info';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: Date;
  sentAt?: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}
