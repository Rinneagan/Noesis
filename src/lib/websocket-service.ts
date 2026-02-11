export interface WebSocketMessage {
  type: 'attendance_update' | 'session_start' | 'session_end' | 'student_checkin' | 'location_verification' | 'notification';
  data: any;
  timestamp: number;
  sessionId?: string;
  userId?: string;
}

export interface AttendanceUpdateMessage {
  sessionId: string;
  studentId: string;
  status: 'present' | 'absent' | 'late';
  timestamp: string;
  method?: 'manual' | 'qr' | 'photo' | 'location';
}

export interface SessionStartMessage {
  sessionId: string;
  classId: string;
  className: string;
  startTime: string;
  lecturerId: string;
}

export interface StudentCheckInMessage {
  sessionId: string;
  studentId: string;
  studentName: string;
  timestamp: string;
  method: 'qr' | 'manual' | 'photo' | 'location';
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
}

export class WebSocketService {
  private static instance: WebSocketService;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Set<(message: WebSocketMessage) => void>> = new Map();
  private isConnecting = false;

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  connect(url: string = 'ws://localhost:3001'): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnecting) {
        reject(new Error('Connection already in progress'));
        return;
      }

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.isConnecting = true;

      try {
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.isConnecting = false;
          // Only reconnect if not a normal closure
          if (event.code !== 1000) {
            this.handleReconnect();
          }
        };

        this.ws.onerror = (event) => {
          console.error('WebSocket error:', event);
          this.isConnecting = false;
          // Gracefully handle connection errors
          console.log('WebSocket connection failed - continuing without real-time features');
          resolve(); // Don't reject, just continue without WebSocket
        };
      } catch (error) {
        this.isConnecting = false;
        console.log('WebSocket not available - continuing without real-time features');
        resolve(); // Don't reject, just continue without WebSocket
      }
    });
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connect().catch(error => {
        console.error('Reconnection failed:', error.message);
        // Don't keep trying if server isn't running
        if (error.message.includes('WebSocket server not available')) {
          console.log('Stopping reconnection attempts - server not running');
          return;
        }
      });
    }, this.reconnectDelay);

    // Exponential backoff
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
  }

  private handleMessage(message: WebSocketMessage): void {
    const typeListeners = this.listeners.get(message.type);
    if (typeListeners) {
      typeListeners.forEach(listener => listener(message));
    }

    // Also notify all listeners for wildcard
    const allListeners = this.listeners.get('*');
    if (allListeners) {
      allListeners.forEach(listener => listener(message));
    }
  }

  subscribe(type: string, listener: (message: WebSocketMessage) => void): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    
    this.listeners.get(type)!.add(listener);

    // Return unsubscribe function
    return () => {
      const typeListeners = this.listeners.get(type);
      if (typeListeners) {
        typeListeners.delete(listener);
        if (typeListeners.size === 0) {
          this.listeners.delete(type);
        }
      }
    };
  }

  send(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message not sent:', message);
    }
  }

  // Specific message senders
  sendAttendanceUpdate(data: AttendanceUpdateMessage): void {
    this.send({
      type: 'attendance_update',
      data,
      timestamp: Date.now(),
      sessionId: data.sessionId
    });
  }

  sendSessionStart(data: SessionStartMessage): void {
    this.send({
      type: 'session_start',
      data,
      timestamp: Date.now()
    });
  }

  sendSessionEnd(sessionId: string): void {
    this.send({
      type: 'session_end',
      data: { sessionId },
      timestamp: Date.now(),
      sessionId
    });
  }

  sendStudentCheckIn(data: StudentCheckInMessage): void {
    this.send({
      type: 'student_checkin',
      data,
      timestamp: Date.now(),
      sessionId: data.sessionId
    });
  }

  sendLocationVerification(sessionId: string, studentId: string, location: any): void {
    this.send({
      type: 'location_verification',
      data: { sessionId, studentId, location },
      timestamp: Date.now(),
      sessionId
    });
  }

  sendNotification(userId: string, notification: any): void {
    this.send({
      type: 'notification',
      data: notification,
      timestamp: Date.now(),
      userId
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
    this.reconnectAttempts = 0;
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  getConnectionState(): string {
    if (!this.ws) return 'DISCONNECTED';
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'CONNECTING';
      case WebSocket.OPEN: return 'OPEN';
      case WebSocket.CLOSING: return 'CLOSING';
      case WebSocket.CLOSED: return 'CLOSED';
      default: return 'UNKNOWN';
    }
  }
}

export const webSocketService = WebSocketService.getInstance();
