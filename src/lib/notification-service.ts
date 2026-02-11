import { Notification, User, AttendanceRecord, AttendanceSession } from '@/types';

export interface NotificationTemplate {
  id: string;
  type: Notification['type'];
  title: string;
  message: string;
  data?: any;
}

export interface NotificationRule {
  id: string;
  name: string;
  enabled: boolean;
  triggers: string[];
  template: NotificationTemplate;
  conditions?: {
    minAttendanceRate?: number;
    consecutiveAbsences?: number;
    timeWindow?: number; // minutes
  };
}

export class NotificationService {
  private static instance: NotificationService;
  private notifications: Map<string, Notification[]> = new Map();
  private rules: NotificationRule[] = [];

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  constructor() {
    this.initializeDefaultRules();
  }

  private initializeDefaultRules(): void {
    this.rules = [
      {
        id: 'absence-alert',
        name: 'Absence Alert',
        enabled: true,
        triggers: ['attendance_recorded'],
        template: {
          id: 'absence-alert',
          type: 'absence',
          title: 'Absence Detected',
          message: 'You were marked absent for {className} on {date}'
        }
      },
      {
        id: 'late-alert',
        name: 'Late Arrival Alert',
        enabled: true,
        triggers: ['attendance_recorded'],
        template: {
          id: 'late-alert',
          type: 'late',
          title: 'Late Arrival',
          message: 'You were marked late for {className} on {date}'
        }
      },
      {
        id: 'low-attendance-warning',
        name: 'Low Attendance Warning',
        enabled: true,
        triggers: ['attendance_analyzed'],
        conditions: {
          minAttendanceRate: 75
        },
        template: {
          id: 'low-attendance-warning',
          type: 'alert',
          title: 'Attendance Warning',
          message: 'Your attendance rate for {className} is {attendanceRate}%. Please improve your attendance.'
        }
      },
      {
        id: 'consecutive-absences',
        name: 'Consecutive Absences Alert',
        enabled: true,
        triggers: ['attendance_analyzed'],
        conditions: {
          consecutiveAbsences: 3
        },
        template: {
          id: 'consecutive-absences',
          type: 'alert',
          title: 'Consecutive Absences',
          message: 'You have been absent for {consecutiveDays} consecutive days in {className}'
        }
      },
      {
        id: 'session-reminder',
        name: 'Class Session Reminder',
        enabled: true,
        triggers: ['session_scheduled'],
        conditions: {
          timeWindow: 30 // minutes before class
        },
        template: {
          id: 'session-reminder',
          type: 'reminder',
          title: 'Class Reminder',
          message: 'Reminder: {className} starts in {timeRemaining} minutes'
        }
      }
    ];
  }

  // Process attendance record and trigger notifications
  async processAttendanceRecord(
    record: AttendanceRecord,
    student: User,
    classInfo: any,
    session: AttendanceSession
  ): Promise<void> {
    const applicableRules = this.rules.filter(rule => 
      rule.enabled && rule.triggers.includes('attendance_recorded')
    );

    for (const rule of applicableRules) {
      if (await this.evaluateRule(rule, record, student, classInfo, session)) {
        const notification = await this.createNotification(rule.template, {
          record,
          student,
          classInfo,
          session
        });
        
        await this.sendNotification(student.id, notification);
      }
    }
  }

  // Process attendance analytics and trigger notifications
  async processAttendanceAnalytics(
    student: User,
    classInfo: any,
    analytics: {
      attendanceRate: number;
      consecutiveAbsences: number;
      recentRecords: AttendanceRecord[];
    }
  ): Promise<void> {
    const applicableRules = this.rules.filter(rule => 
      rule.enabled && rule.triggers.includes('attendance_analyzed')
    );

    for (const rule of applicableRules) {
      if (await this.evaluateAnalyticsRule(rule, analytics, student, classInfo)) {
        const notification = await this.createNotification(rule.template, {
          analytics,
          student,
          classInfo
        });
        
        await this.sendNotification(student.id, notification);
      }
    }
  }

  // Send session reminder
  async sendSessionReminder(
    students: User[],
    classInfo: any,
    session: AttendanceSession,
    minutesUntilStart: number
  ): Promise<void> {
    const reminderRule = this.rules.find(rule => 
      rule.id === 'session-reminder' && rule.enabled
    );

    if (!reminderRule || minutesUntilStart > (reminderRule.conditions?.timeWindow || 30)) {
      return;
    }

    for (const student of students) {
      const notification = await this.createNotification(reminderRule.template, {
        classInfo,
        session,
        timeRemaining: minutesUntilStart
      });
      
      await this.sendNotification(student.id, notification);
    }
  }

  private async evaluateRule(
    rule: NotificationRule,
    record: AttendanceRecord,
    student: User,
    classInfo: any,
    session: AttendanceSession
  ): Promise<boolean> {
    switch (rule.id) {
      case 'absence-alert':
        return record.status === 'absent';
      
      case 'late-alert':
        return record.status === 'late';
      
      default:
        return false;
    }
  }

  private async evaluateAnalyticsRule(
    rule: NotificationRule,
    analytics: any,
    student: User,
    classInfo: any
  ): Promise<boolean> {
    switch (rule.id) {
      case 'low-attendance-warning':
        return analytics.attendanceRate < (rule.conditions?.minAttendanceRate || 75);
      
      case 'consecutive-absences':
        return analytics.consecutiveAbsences >= (rule.conditions?.consecutiveAbsences || 3);
      
      default:
        return false;
    }
  }

  private async createNotification(
    template: NotificationTemplate,
    data: any
  ): Promise<Notification> {
    const message = this.interpolateMessage(template.message, data);
    
    return {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: data.student?.id || 'unknown',
      type: template.type,
      title: this.interpolateMessage(template.title, data),
      message,
      data: template.data || data,
      read: false,
      createdAt: new Date()
    };
  }

  private interpolateMessage(template: string, data: any): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      const value = this.getNestedValue(data, key);
      return value !== undefined ? String(value) : match;
    });
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  private async sendNotification(userId: string, notification: Notification): Promise<void> {
    // Store notification
    if (!this.notifications.has(userId)) {
      this.notifications.set(userId, []);
    }
    this.notifications.get(userId)!.push(notification);

    // Send via different channels based on user preferences
    await this.sendEmailNotification(userId, notification);
    await this.sendSMSNotification(userId, notification);
    await this.sendPushNotification(userId, notification);
    await this.sendWebSocketNotification(userId, notification);
  }

  private async sendEmailNotification(userId: string, notification: Notification): Promise<void> {
    // In a real implementation, this would integrate with email service
    console.log(`Email notification sent to ${userId}:`, notification);
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  private async sendSMSNotification(userId: string, notification: Notification): Promise<void> {
    // In a real implementation, this would integrate with SMS service
    console.log(`SMS notification sent to ${userId}:`, notification);
    
    // Simulate SMS sending delay
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  private async sendPushNotification(userId: string, notification: Notification): Promise<void> {
    // In a real implementation, this would use Web Push API or service worker
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration) {
          // Send push notification via service worker
          console.log(`Push notification sent to ${userId}:`, notification);
        }
      } catch (error) {
        console.error('Push notification error:', error);
      }
    }
  }

  private async sendWebSocketNotification(userId: string, notification: Notification): Promise<void> {
    // This would integrate with the WebSocket service
    console.log(`WebSocket notification sent to ${userId}:`, notification);
  }

  // Get notifications for a user
  getUserNotifications(userId: string): Notification[] {
    return this.notifications.get(userId) || [];
  }

  // Mark notification as read
  markAsRead(userId: string, notificationId: string): void {
    const userNotifications = this.notifications.get(userId);
    if (userNotifications) {
      const notification = userNotifications.find(n => n.id === notificationId);
      if (notification) {
        notification.read = true;
      }
    }
  }

  // Clear all notifications for a user
  clearUserNotifications(userId: string): void {
    this.notifications.delete(userId);
  }

  // Get notification rules
  getRules(): NotificationRule[] {
    return this.rules;
  }

  // Update notification rule
  updateRule(ruleId: string, updates: Partial<NotificationRule>): void {
    const ruleIndex = this.rules.findIndex(r => r.id === ruleId);
    if (ruleIndex !== -1) {
      this.rules[ruleIndex] = { ...this.rules[ruleIndex], ...updates };
    }
  }

  // Get notification statistics
  getStatistics(): {
    totalNotifications: number;
    notificationsByType: Record<string, number>;
    activeRules: number;
  } {
    const totalNotifications = Array.from(this.notifications.values())
      .reduce((total, userNotifs) => total + userNotifs.length, 0);

    const notificationsByType: Record<string, number> = {};
    Array.from(this.notifications.values()).flat().forEach(notification => {
      notificationsByType[notification.type] = (notificationsByType[notification.type] || 0) + 1;
    });

    const activeRules = this.rules.filter(rule => rule.enabled).length;

    return {
      totalNotifications,
      notificationsByType,
      activeRules
    };
  }
}

export const notificationService = NotificationService.getInstance();
